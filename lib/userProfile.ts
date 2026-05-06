import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { AvatarSpec, defaultAvatarSpec } from './avatarSystem';
import { getFirebaseDb } from './firebaseClient';

export interface UserProfile {
  name: string;
  avatar: AvatarSpec;
}

const STORAGE_KEY = 'bg-user-profile-v2';
const CLIENT_ID_KEY = 'bg-client-id-v1';

const NAME_A = ['Joyful','Bright','Steady','Swift','Faithful','Calm','Bold','Kind','Keen','Wise','Noble','Brave'];
const NAME_B = ['Pilgrim','Scholar','Traveler','Reader','Seeker','Psalmist','Scribe','Keeper','Beacon','Friend','Shepherd','Herald'];

function randomItem<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateGuestProfile(): UserProfile {
  const seed = Math.floor(Math.random() * 48);
  const avatar = defaultAvatarSpec(seed);
  const suffix = Math.floor(100 + Math.random() * 900);
  return { name: `${randomItem(NAME_A)}_${randomItem(NAME_B)}-${suffix}`, avatar };
}

export function readLocalProfile(): UserProfile {
  if (typeof window === 'undefined') return generateGuestProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const guest = generateGuestProfile();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guest));
      return guest;
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: parsed.name ?? generateGuestProfile().name,
      avatar: parsed.avatar ?? defaultAvatarSpec(0),
    };
  } catch {
    return generateGuestProfile();
  }
}

export function writeLocalProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function readClientId(): string {
  if (typeof window === 'undefined') return 'server-client';
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const created = `client-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

export async function loadRemoteProfile(user: User): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<UserProfile>;
  if (!data.name || !data.avatar) return null;
  return { name: data.name, avatar: data.avatar };
}

export async function saveRemoteProfile(user: User, profile: UserProfile) {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(
    doc(db, 'users', user.uid),
    { name: profile.name, avatar: profile.avatar, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
