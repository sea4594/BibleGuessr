import { AvatarSpec, defaultAvatarSpec } from './avatarSystem';
import { setSyncedLocalStorageItem } from './localDataState';

export interface UserProfile {
  name: string;
  avatar: AvatarSpec;
}

const STORAGE_KEY = 'bg-user-profile-v2';
const CLIENT_ID_KEY = 'bg-client-id-v1';

const NAME_A = ['Joyful','Bright','Steady','Swift','Faithful','Calm','Bold','Kind','Keen','Wise','Noble','Brave'];
const NAME_B = ['Pilgrim','Scholar','Traveler','Reader','Seeker','Psalmist','Scribe','Keeper','Beacon','Friend','Shepherd','Herald'];

function randomItem<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function hashStringSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizeAvatar(raw: unknown, fallbackSeed: number): AvatarSpec {
  const fallback = defaultAvatarSpec(fallbackSeed);
  if (!raw || typeof raw !== 'object') return fallback;
  const incoming = raw as Partial<AvatarSpec>;

  return {
    ...fallback,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) => typeof value === 'string')
    ),
  } as AvatarSpec;
}

function generateStableGuestName(seed: number) {
  const first = NAME_A[seed % NAME_A.length];
  const second = NAME_B[Math.floor(seed / NAME_A.length) % NAME_B.length];
  const suffix = 100 + (seed % 900);
  return `${first}_${second}-${suffix}`;
}

function readOrCreateClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const created = `client-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

function buildStableGuestProfile(clientId: string): UserProfile {
  const seed = hashStringSeed(clientId) % 997;
  return {
    name: generateStableGuestName(seed),
    avatar: defaultAvatarSpec(seed),
  };
}

function persistProfile(profile: UserProfile, notify = true) {
  if (notify) {
    setSyncedLocalStorageItem(STORAGE_KEY, JSON.stringify(profile));
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export function generateGuestProfile(): UserProfile {
  const seed = Math.floor(Math.random() * 48);
  const avatar = defaultAvatarSpec(seed);
  const suffix = Math.floor(100 + Math.random() * 900);
  return { name: `${randomItem(NAME_A)}_${randomItem(NAME_B)}-${suffix}`, avatar };
}

export function readLocalProfile(): UserProfile {
  if (typeof window === 'undefined') return generateGuestProfile();

  const clientId = readOrCreateClientId();
  const stableGuest = buildStableGuestProfile(clientId);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistProfile(stableGuest, true);
      return stableGuest;
    }

    const parsed = JSON.parse(raw) as Partial<UserProfile>;

    const sanitized: UserProfile = {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : stableGuest.name,
      avatar: normalizeAvatar(parsed.avatar, hashStringSeed(clientId) % 997),
    };

    if (JSON.stringify(sanitized) !== raw) {
      persistProfile(sanitized, true);
    }

    return sanitized;
  } catch {
    persistProfile(stableGuest, true);
    return stableGuest;
  }
}

export function writeLocalProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  setSyncedLocalStorageItem(STORAGE_KEY, JSON.stringify(profile));
}

export function readClientId(): string {
  if (typeof window === 'undefined') return 'server-client';
  return readOrCreateClientId();
}
