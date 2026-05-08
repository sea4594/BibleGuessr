import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { ensureFirebaseSession, getFirebaseDb } from './firebaseClient';
import type { AvatarSpec } from './avatarSystem';
import { gameModes, type GameModeId } from './gameModes';

export interface PartyMember {
  id: string;
  name: string;
  avatar: AvatarSpec;
  isHost: boolean;
  joinedAt: number;
}

export interface PartyRoom {
  code: string;
  hostId: string;
  members: PartyMember[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lobbySettings: PartyLobbySettings;
  game?: PartyGameState;
}

export interface PartyLobbySettings {
  modeId: GameModeId | null;
  roundsPerPlayer: number | null;
  timerDurationSeconds: number | null;
}

export interface PartyVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface PartySubmission {
  memberId: string;
  playerName: string;
  score: number;
  baseScore: number;
  submittedAt: number;
  wasBlankGuess?: boolean;
}

export interface StartPartyGameConfig {
  modeId: GameModeId;
  roundsPerPlayer: number;
  timerDurationSeconds: number;
  firstVerse: PartyVerse;
}

export interface PartyGameState {
  status: 'lobby' | 'in-round' | 'round-complete' | 'finished';
  modeId: GameModeId;
  roundsPerPlayer: number;
  totalRounds: number;
  timerDurationSeconds: number;
  currentRound: number;
  roundStartedAt: number;
  roundVerse: PartyVerse;
  submissions: Record<string, PartySubmission>;
  roundScores: Record<string, number>;
  scores: Record<string, number>;
  startedBy: string;
  startedAt: number;
  updatedAt: number;
}

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PARTY_CODE_TTL_MS = 1000 * 60 * 60 * 6;
const PARTY_TIMER_MIN_SECONDS = 5;
const PARTY_TIMER_MAX_SECONDS = 90;

function generateCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return code;
}

function partyDoc(code: string) {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, 'parties', code);
}

function expiresAtFromNow(now: number) {
  return now + PARTY_CODE_TTL_MS;
}

function isRoomExpired(data: unknown) {
  const room = data as { expiresAt?: unknown };
  const expiresAt = typeof room?.expiresAt === 'number' ? room.expiresAt : 0;
  return expiresAt <= Date.now();
}

function isSelectablePartyMode(modeId: string): modeId is GameModeId {
  if (!(modeId in gameModes)) return false;
  return !gameModes[modeId as GameModeId].isSingleBook;
}

function clampRoundsPerPlayer(value: number | null): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(1, Math.min(10, Math.round(value)));
}

function clampPartyTimerDurationSeconds(value: number | null): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const rounded = Math.round(value / 5) * 5;
  return Math.max(PARTY_TIMER_MIN_SECONDS, Math.min(PARTY_TIMER_MAX_SECONDS, rounded));
}

function makeDefaultLobbySettings(): PartyLobbySettings {
  return {
    modeId: null,
    roundsPerPlayer: null,
    timerDurationSeconds: null,
  };
}

function normalizeLobbySettings(raw: unknown): PartyLobbySettings {
  if (!raw || typeof raw !== 'object') return makeDefaultLobbySettings();
  const value = raw as {
    modeId?: unknown;
    roundsPerPlayer?: unknown;
    timerDurationSeconds?: unknown;
  };

  return {
    modeId: typeof value.modeId === 'string' && isSelectablePartyMode(value.modeId) ? value.modeId : null,
    roundsPerPlayer: clampRoundsPerPlayer(
      typeof value.roundsPerPlayer === 'number' ? value.roundsPerPlayer : null
    ),
    timerDurationSeconds: clampPartyTimerDurationSeconds(
      typeof value.timerDurationSeconds === 'number' ? value.timerDurationSeconds : null
    ),
  };
}

function mergeLobbySettings(current: PartyLobbySettings, incoming: Partial<PartyLobbySettings>) {
  const nextMode = incoming.modeId === undefined
    ? current.modeId
    : incoming.modeId === null
      ? null
      : isSelectablePartyMode(incoming.modeId)
        ? incoming.modeId
        : current.modeId;

  const nextRounds = incoming.roundsPerPlayer === undefined
    ? current.roundsPerPlayer
    : clampRoundsPerPlayer(incoming.roundsPerPlayer);

  const nextTimer = incoming.timerDurationSeconds === undefined
    ? current.timerDurationSeconds
    : clampPartyTimerDurationSeconds(incoming.timerDurationSeconds);

  return {
    modeId: nextMode,
    roundsPerPlayer: nextRounds,
    timerDurationSeconds: nextTimer,
  } satisfies PartyLobbySettings;
}

export async function createUniquePartyCode(): Promise<string | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  await ensureFirebaseSession();

  for (let attempt = 0; attempt < 30; attempt++) {
    const code = generateCode();
    const ref = doc(db, 'parties', code);
    const existing = await getDoc(ref);
    if (!existing.exists() || isRoomExpired(existing.data())) {
      return code;
    }
  }

  return null;
}

export async function hostParty(host: PartyMember): Promise<PartyRoom | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  await ensureFirebaseSession();

  for (let attempt = 0; attempt < 30; attempt++) {
    const code = generateCode();
    const ref = doc(db, 'parties', code);
    const now = Date.now();
    const room: PartyRoom = {
      code,
      hostId: host.id,
      members: [{ ...host, isHost: true, joinedAt: now }],
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAtFromNow(now),
      lobbySettings: makeDefaultLobbySettings(),
    };

    try {
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (snapshot.exists() && !isRoomExpired(snapshot.data())) {
          throw new Error('party-code-in-use');
        }

        tx.set(ref, {
          ...room,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      return room;
    } catch (error) {
      if (error instanceof Error && error.message === 'party-code-in-use') {
        continue;
      }
      return null;
    }
  }

  return null;
}

export async function joinParty(code: string, member: PartyMember): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) {
        throw new Error('Party not found');
      }

      if (isRoomExpired(snapshot.data())) {
        throw new Error('Party expired');
      }

      const data = snapshot.data() as PartyRoom;
      const members = data.members ?? [];
      const deduped = members.filter(m => m.id !== member.id);
      const now = Date.now();
      deduped.push({ ...member, isHost: false, joinedAt: Date.now() });
      tx.update(ref, {
        members: deduped,
        updatedAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(now),
      });
    });

    return true;
  } catch {
    return false;
  }
}

export async function upsertPartyMember(code: string, member: PartyMember): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const data = snapshot.data() as PartyRoom;
      const members = data.members ?? [];
      const existing = members.find(m => m.id === member.id);
      const now = Date.now();

      if (!existing) {
        members.push({ ...member, isHost: false, joinedAt: Date.now() });
      } else {
        Object.assign(existing, {
          name: member.name,
          avatar: member.avatar,
          joinedAt: existing.joinedAt,
        });
      }

      tx.update(ref, {
        members,
        updatedAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(now),
      });
    });

    return true;
  } catch {
    return false;
  }
}

function initialScoresByMember(members: PartyMember[]) {
  const scores: Record<string, number> = {};
  for (const member of members) scores[member.id] = 0;
  return scores;
}

export async function startPartyGame(code: string, hostId: string, config: StartPartyGameConfig): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);
  const now = Date.now();

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      if (room.hostId !== hostId) throw new Error('Only host can start');

      const members = room.members ?? [];
      const safeRounds = Math.max(1, Math.min(10, config.roundsPerPlayer));
      const safeTimer = clampPartyTimerDurationSeconds(config.timerDurationSeconds) ?? PARTY_TIMER_MIN_SECONDS;
      const gameState: PartyGameState = {
        status: 'in-round',
        modeId: config.modeId,
        roundsPerPlayer: safeRounds,
        totalRounds: safeRounds,
        timerDurationSeconds: safeTimer,
        currentRound: 1,
        roundStartedAt: now,
        roundVerse: config.firstVerse,
        submissions: {},
        roundScores: {},
        scores: initialScoresByMember(members),
        startedBy: hostId,
        startedAt: now,
        updatedAt: now,
      };

      tx.update(ref, {
        game: gameState,
        lobbySettings: {
          modeId: config.modeId,
          roundsPerPlayer: safeRounds,
          timerDurationSeconds: safeTimer,
        },
        updatedAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(now),
      });
    });

    return true;
  } catch {
    return false;
  }
}

export async function submitPartyRound(
  code: string,
  memberId: string,
  submission: Omit<PartySubmission, 'memberId' | 'submittedAt'>
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      const game = room.game;
      if (!game || game.status !== 'in-round') throw new Error('Round is not active');

      const memberExists = (room.members ?? []).some(m => m.id === memberId);
      if (!memberExists) throw new Error('Member not found');

      if (game.submissions[memberId]) return;

      const nextSubmissions: Record<string, PartySubmission> = {
        ...game.submissions,
        [memberId]: {
          memberId,
          playerName: submission.playerName,
          score: submission.score,
          baseScore: submission.baseScore,
          wasBlankGuess: submission.wasBlankGuess,
          submittedAt: Date.now(),
        },
      };

      const nextScores: Record<string, number> = { ...game.scores };
      nextScores[memberId] = (nextScores[memberId] ?? 0) + submission.score;

      const activeMemberIds = (room.members ?? []).map(m => m.id);
      const allSubmitted = activeMemberIds.every(id => Boolean(nextSubmissions[id]));

      const nextRoundScores: Record<string, number> = {};
      for (const id of activeMemberIds) {
        nextRoundScores[id] = nextSubmissions[id]?.score ?? 0;
      }

      tx.update(ref, {
        game: {
          ...game,
          submissions: nextSubmissions,
          scores: nextScores,
          roundScores: nextRoundScores,
          status: allSubmitted ? 'round-complete' : 'in-round',
          updatedAt: Date.now(),
        },
        updatedAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(Date.now()),
      });
    });

    return true;
  } catch {
    return false;
  }
}

export async function hostAdvancePartyRound(
  code: string,
  hostId: string,
  nextVerse?: PartyVerse
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      const game = room.game;
      if (!game) throw new Error('No game state');
      if (room.hostId !== hostId) throw new Error('Only host can advance');
      if (game.status !== 'round-complete') throw new Error('Round not complete');

      if (game.currentRound >= game.totalRounds) {
        const now = Date.now();
        tx.update(ref, {
          game: {
            ...game,
            status: 'finished',
            updatedAt: now,
          },
          updatedAt: serverTimestamp(),
          expiresAt: expiresAtFromNow(now),
        });
        return;
      }

      if (!nextVerse) throw new Error('Next verse required');

      const now = Date.now();
      tx.update(ref, {
        game: {
          ...game,
          status: 'in-round',
          currentRound: game.currentRound + 1,
          roundStartedAt: now,
          roundVerse: nextVerse,
          submissions: {},
          roundScores: {},
          updatedAt: now,
        },
        updatedAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(now),
      });
    });

    return true;
  } catch {
    return false;
  }
}

export async function updatePartyLobbySettings(
  code: string,
  hostId: string,
  incoming: Partial<PartyLobbySettings>
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      if (room.hostId !== hostId) throw new Error('Only host can edit settings');

      const nextLobbySettings = mergeLobbySettings(normalizeLobbySettings(room.lobbySettings), incoming);
      const now = Date.now();

      tx.update(ref, {
        lobbySettings: nextLobbySettings,
        updatedAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(now),
      });
    });

    return true;
  } catch {
    return false;
  }
}

export function subscribeToParty(code: string, onUpdate: (room: PartyRoom | null) => void) {
  const ref = partyDoc(code);
  if (!ref) {
    onUpdate(null);
    return () => undefined;
  }

  return onSnapshot(
    ref,
    snapshot => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }

      const data = snapshot.data() as PartyRoom;
      if (isRoomExpired(data)) {
        onUpdate(null);
        return;
      }

      onUpdate({
        ...data,
        lobbySettings: normalizeLobbySettings(data.lobbySettings),
      });
    },
    () => {
      onUpdate(null);
    }
  );
}

export async function leaveParty(code: string, memberId: string) {
  const db = getFirebaseDb();
  if (!db) return;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);

  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) return;
    if (isRoomExpired(snapshot.data())) {
      tx.delete(ref);
      return;
    }

    const room = snapshot.data() as PartyRoom;
    const filtered = (room.members ?? []).filter(m => m.id !== memberId);
    if (filtered.length === 0) {
      tx.delete(ref);
      return;
    }

    const nextHostId = room.hostId === memberId ? (filtered[0]?.id ?? '') : room.hostId;
    const normalizedMembers = filtered.map(member => ({
      ...member,
      isHost: member.id === nextHostId,
    }));

    const game = room.game;
    let nextGame = game;

    if (game) {
      const nextSubmissions = { ...game.submissions };
      delete nextSubmissions[memberId];

      const nextScores = { ...game.scores };
      delete nextScores[memberId];

      const nextRoundScores = { ...game.roundScores };
      delete nextRoundScores[memberId];

      const activeMemberIds = normalizedMembers.map(member => member.id);
      const allSubmitted =
        game.status === 'in-round' &&
        activeMemberIds.length > 0 &&
        activeMemberIds.every(id => Boolean(nextSubmissions[id]));

      nextGame = {
        ...game,
        submissions: nextSubmissions,
        scores: nextScores,
        roundScores: nextRoundScores,
        status: allSubmitted ? 'round-complete' : game.status,
        updatedAt: Date.now(),
      };
    }

    tx.update(ref, {
      hostId: nextHostId,
      members: normalizedMembers,
      game: nextGame,
      updatedAt: serverTimestamp(),
      expiresAt: expiresAtFromNow(Date.now()),
    });
  });
}