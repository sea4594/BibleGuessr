import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ensureFirebaseSession, getFirebaseAuth, getFirebaseDb } from './firebaseClient';
import { defaultAvatarSpec, type AvatarSpec } from './avatarSystem';
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
  selectedBook: string | null;
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
  selectedBook?: string;
  firstVerse: PartyVerse;
}

export interface PartyGameState {
  status: 'lobby' | 'in-round' | 'round-complete' | 'finished';
  modeId: GameModeId;
  selectedBook?: string;
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

function sanitizeAvatarForStorage(avatar: AvatarSpec): AvatarSpec {
  const fallback = defaultAvatarSpec(0);
  const sanitized: AvatarSpec = {
    skinColor: typeof avatar.skinColor === 'string' ? avatar.skinColor : fallback.skinColor,
    hairStyle: typeof avatar.hairStyle === 'string' ? avatar.hairStyle : fallback.hairStyle,
    hairColor: typeof avatar.hairColor === 'string' ? avatar.hairColor : fallback.hairColor,
    eyeType: typeof avatar.eyeType === 'string' ? avatar.eyeType : fallback.eyeType,
    eyeColor: typeof avatar.eyeColor === 'string' ? avatar.eyeColor : fallback.eyeColor,
    mouthType: typeof avatar.mouthType === 'string' ? avatar.mouthType : fallback.mouthType,
    shirtStyle: typeof avatar.shirtStyle === 'string' ? avatar.shirtStyle : fallback.shirtStyle,
    shirtColor: typeof avatar.shirtColor === 'string' ? avatar.shirtColor : fallback.shirtColor,
    pantsColor: typeof avatar.pantsColor === 'string' ? avatar.pantsColor : fallback.pantsColor,
    shoeColor: typeof avatar.shoeColor === 'string' ? avatar.shoeColor : fallback.shoeColor,
    accessory: typeof avatar.accessory === 'string' ? avatar.accessory : fallback.accessory,
  };

  if (typeof avatar.background === 'string') {
    sanitized.background = avatar.background;
  }

  return sanitized;
}

function sanitizeMemberForStorage(member: PartyMember, forceHost?: boolean): PartyMember {
  return {
    ...member,
    name: member.name.trim() || 'Player',
    isHost: forceHost ?? member.isHost,
    avatar: sanitizeAvatarForStorage(member.avatar),
  };
}

function resolveActorId(providedId: string) {
  const auth = getFirebaseAuth();
  return auth?.currentUser?.uid ?? providedId;
}

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
  return modeId in gameModes;
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
    selectedBook: null,
    roundsPerPlayer: null,
    timerDurationSeconds: null,
  };
}

function normalizeLobbySettings(raw: unknown): PartyLobbySettings {
  if (!raw || typeof raw !== 'object') return makeDefaultLobbySettings();
  const value = raw as {
    modeId?: unknown;
    selectedBook?: unknown;
    roundsPerPlayer?: unknown;
    timerDurationSeconds?: unknown;
  };

  return {
    modeId: typeof value.modeId === 'string' && isSelectablePartyMode(value.modeId) ? value.modeId : null,
    selectedBook: typeof value.selectedBook === 'string' && value.selectedBook.trim() ? value.selectedBook : null,
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

  const nextSelectedBook = incoming.selectedBook === undefined
    ? current.selectedBook
    : incoming.selectedBook && incoming.selectedBook.trim()
      ? incoming.selectedBook
      : null;

  const nextRounds = incoming.roundsPerPlayer === undefined
    ? current.roundsPerPlayer
    : clampRoundsPerPlayer(incoming.roundsPerPlayer);

  const nextTimer = incoming.timerDurationSeconds === undefined
    ? current.timerDurationSeconds
    : clampPartyTimerDurationSeconds(incoming.timerDurationSeconds);

  return {
    modeId: nextMode,
    selectedBook: nextMode === 'book-selection' ? nextSelectedBook : null,
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
    try {
      const existing = await getDoc(ref);
      if (!existing.exists() || isRoomExpired(existing.data())) {
        return code;
      }
    } catch {
      // If reads are restricted by rules, still return a random candidate and rely on write path.
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
    const hostMember = sanitizeMemberForStorage({ ...host, id: resolveActorId(host.id), joinedAt: now }, true);
    const room: PartyRoom = {
      code,
      hostId: hostMember.id,
      members: [hostMember],
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

      try {
        // Fallback for rule sets that disallow reads inside transactions.
        await setDoc(ref, {
          ...room,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return room;
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function joinParty(code: string, member: PartyMember): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);
  const actorId = resolveActorId(member.id);

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
      const deduped = members.filter(m => m.id !== actorId);
      const now = Date.now();
      deduped.push(sanitizeMemberForStorage({ ...member, id: actorId, isHost: false, joinedAt: now }));
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
  const actorId = resolveActorId(member.id);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const data = snapshot.data() as PartyRoom;
      const members = data.members ?? [];
      const existing = members.find(m => m.id === actorId);
      const now = Date.now();
      const sanitizedMember = sanitizeMemberForStorage({ ...member, id: actorId });

      if (!existing) {
        members.push({ ...sanitizedMember, isHost: false, joinedAt: now });
      } else {
        Object.assign(existing, {
          name: sanitizedMember.name,
          avatar: sanitizedMember.avatar,
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
  const actorId = resolveActorId(hostId);
  const now = Date.now();

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      if (room.hostId !== actorId) throw new Error('Only host can start');

      const members = room.members ?? [];
      const safeRounds = Math.max(1, Math.min(10, config.roundsPerPlayer));
      const safeTimer = clampPartyTimerDurationSeconds(config.timerDurationSeconds) ?? PARTY_TIMER_MIN_SECONDS;
      const gameState: PartyGameState = {
        status: 'in-round',
        modeId: config.modeId,
        ...(config.selectedBook ? { selectedBook: config.selectedBook } : {}),
        roundsPerPlayer: safeRounds,
        totalRounds: safeRounds,
        timerDurationSeconds: safeTimer,
        currentRound: 1,
        roundStartedAt: now,
        roundVerse: config.firstVerse,
        submissions: {},
        roundScores: {},
        scores: initialScoresByMember(members),
        startedBy: actorId,
        startedAt: now,
        updatedAt: now,
      };

      tx.update(ref, {
        game: gameState,
        lobbySettings: {
          modeId: config.modeId,
          selectedBook: config.modeId === 'book-selection' ? (config.selectedBook ?? null) : null,
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
  const actorId = resolveActorId(memberId);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      const game = room.game;
      if (!game || game.status !== 'in-round') throw new Error('Round is not active');

      const memberExists = (room.members ?? []).some(m => m.id === actorId);
      if (!memberExists) throw new Error('Member not found');

      if (game.submissions[actorId]) return;

      const nextSubmissions: Record<string, PartySubmission> = {
        ...game.submissions,
        [actorId]: {
          memberId: actorId,
          playerName: submission.playerName,
          score: submission.score,
          baseScore: submission.baseScore,
          wasBlankGuess: submission.wasBlankGuess,
          submittedAt: Date.now(),
        },
      };

      const nextScores: Record<string, number> = { ...game.scores };
      nextScores[actorId] = (nextScores[actorId] ?? 0) + submission.score;

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
  const actorId = resolveActorId(hostId);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      const game = room.game;
      if (!game) throw new Error('No game state');
      if (room.hostId !== actorId) throw new Error('Only host can advance');
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

export async function hostReturnPartyToLobby(code: string, hostId: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  await ensureFirebaseSession();

  const ref = doc(db, 'parties', code);
  const actorId = resolveActorId(hostId);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      if (room.hostId !== actorId) throw new Error('Only host can return to lobby');

      const now = Date.now();
      tx.update(ref, {
        game: deleteField(),
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
  const actorId = resolveActorId(hostId);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');
      if (isRoomExpired(snapshot.data())) throw new Error('Party expired');

      const room = snapshot.data() as PartyRoom;
      if (room.hostId !== actorId) throw new Error('Only host can edit settings');

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
  const actorId = resolveActorId(memberId);

  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) return;
    if (isRoomExpired(snapshot.data())) {
      tx.delete(ref);
      return;
    }

    const room = snapshot.data() as PartyRoom;
    const filtered = (room.members ?? []).filter(m => m.id !== actorId);
    if (filtered.length === 0) {
      tx.delete(ref);
      return;
    }

    const nextHostId = room.hostId === actorId ? (filtered[0]?.id ?? '') : room.hostId;
    const normalizedMembers = filtered.map(member => ({
      ...member,
      isHost: member.id === nextHostId,
    }));

    const game = room.game;
    let nextGame = game;

    if (game) {
      const nextSubmissions = { ...game.submissions };
      delete nextSubmissions[actorId];

      const nextScores = { ...game.scores };
      delete nextScores[actorId];

      const nextRoundScores = { ...game.roundScores };
      delete nextRoundScores[actorId];

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