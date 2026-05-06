import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebaseClient';
import type { AvatarSpec } from './avatarSystem';

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
  const ref = partyDoc(code);
  if (!ref) return;

  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;

  const room = snapshot.data() as PartyRoom;
  const filtered = (room.members ?? []).filter(m => m.id !== memberId);
  await updateDoc(ref, {
    members: filtered,
    updatedAt: serverTimestamp(),
  });
}