import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebaseClient';
import type { AvatarSpec } from './avatarSystem';
import type { GameModeId } from './gameModes';

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
  game?: PartyGameState;
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

export async function createUniquePartyCode(): Promise<string | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  for (let attempt = 0; attempt < 30; attempt++) {
    const code = generateCode();
    const ref = doc(db, 'parties', code);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      return code;
    }
  }

  return null;
}

export async function hostParty(host: PartyMember): Promise<PartyRoom | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const code = await createUniquePartyCode();
  if (!code) return null;

  const now = Date.now();
  const room: PartyRoom = {
    code,
    hostId: host.id,
    members: [{ ...host, isHost: true, joinedAt: now }],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'parties', code), {
    ...room,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return room;
}

export async function joinParty(code: string, member: PartyMember): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) {
        throw new Error('Party not found');
      }
      const data = snapshot.data() as PartyRoom;
      const members = data.members ?? [];
      const deduped = members.filter(m => m.id !== member.id);
      deduped.push({ ...member, isHost: false, joinedAt: Date.now() });
      tx.update(ref, {
        members: deduped,
        updatedAt: serverTimestamp(),
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

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');

      const data = snapshot.data() as PartyRoom;
      const members = data.members ?? [];
      const existing = members.find(m => m.id === member.id);

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

  const ref = doc(db, 'parties', code);
  const now = Date.now();

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');

      const room = snapshot.data() as PartyRoom;
      if (room.hostId !== hostId) throw new Error('Only host can start');

      const members = room.members ?? [];
      const safeRounds = Math.max(1, Math.min(10, config.roundsPerPlayer));
      const gameState: PartyGameState = {
        status: 'in-round',
        modeId: config.modeId,
        roundsPerPlayer: safeRounds,
        totalRounds: safeRounds,
        timerDurationSeconds: Math.max(0, config.timerDurationSeconds),
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
        updatedAt: serverTimestamp(),
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

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');

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

  const ref = doc(db, 'parties', code);

  try {
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw new Error('Party not found');

      const room = snapshot.data() as PartyRoom;
      const game = room.game;
      if (!game) throw new Error('No game state');
      if (room.hostId !== hostId) throw new Error('Only host can advance');
      if (game.status !== 'round-complete') throw new Error('Round not complete');

      if (game.currentRound >= game.totalRounds) {
        tx.update(ref, {
          game: {
            ...game,
            status: 'finished',
            updatedAt: Date.now(),
          },
          updatedAt: serverTimestamp(),
        });
        return;
      }

      if (!nextVerse) throw new Error('Next verse required');

      tx.update(ref, {
        game: {
          ...game,
          status: 'in-round',
          currentRound: game.currentRound + 1,
          roundStartedAt: Date.now(),
          roundVerse: nextVerse,
          submissions: {},
          roundScores: {},
          updatedAt: Date.now(),
        },
        updatedAt: serverTimestamp(),
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

  return onSnapshot(ref, snapshot => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }
    onUpdate(snapshot.data() as PartyRoom);
  });
}

export async function leaveParty(code: string, memberId: string) {
  const db = getFirebaseDb();
  if (!db) return;

  const ref = doc(db, 'parties', code);

  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) return;

    const room = snapshot.data() as PartyRoom;
    const filtered = (room.members ?? []).filter(m => m.id !== memberId);
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
    });
  });
}