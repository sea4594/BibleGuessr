import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  type Firestore,
} from 'firebase/firestore';
import type { LocalAppSnapshot } from './appStateSync';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const provider = new GoogleAuthProvider();

export type CloudAppSnapshot = LocalAppSnapshot;

export type CloudStateMetadata = {
  updatedAt: number;
  hasData: boolean;
  revision: number;
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let persistenceReadyPromise: Promise<void> | null = null;
let anonymousSignInPromise: Promise<boolean> | null = null;
let authReadyPromise: Promise<void> | null = null;
const AUTH_BOOTSTRAP_ATTEMPT_MS = 7000;

function authAttemptDeadline<T>(promise: Promise<T>, fallback: T, timeoutMs = AUTH_BOOTSTRAP_ATTEMPT_MS): Promise<T> {
  return new Promise(resolve => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, timeoutMs);
    promise.then(
      value => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      () => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

export function isFirebaseConfigured() {
  return firebaseEnabled;
}

export function getFirebaseApp() {
  if (!firebaseEnabled) {
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getGoogleProvider() {
  return provider;
}

export async function ensureFirebaseSession(): Promise<boolean> {
  if (!firebaseEnabled || !auth) return false;
  await ensureAuthReady();
  if (auth.currentUser) return true;

  if (!anonymousSignInPromise) {
    const attempt = signInAnonymously(auth)
      .then(() => true)
      .catch(() => false);
    anonymousSignInPromise = attempt;
    void attempt.finally(() => {
      if (anonymousSignInPromise === attempt) anonymousSignInPromise = null;
    });
  }

  const attempt = anonymousSignInPromise;
  const result = await authAttemptDeadline(attempt, false);
  // Safari/PWA networking can occasionally leave an SDK promise pending forever.
  // Never let one stale attempt poison every future Party operation until restart.
  if (!result && anonymousSignInPromise === attempt) anonymousSignInPromise = null;
  return Boolean(auth.currentUser) || result;
}

export const app: FirebaseApp | null = getFirebaseApp();
export const auth: Auth | null = getFirebaseAuth();
export const db: Firestore | null = getFirebaseDb();

async function ensureAuthPersistence() {
  if (!firebaseEnabled || !auth) return;

  if (!persistenceReadyPromise) {
    const attempt = setPersistence(auth, browserLocalPersistence).catch(() => undefined);
    persistenceReadyPromise = attempt;
    void attempt.finally(() => {
      if (persistenceReadyPromise === attempt) persistenceReadyPromise = null;
    });
  }

  const attempt = persistenceReadyPromise;
  await authAttemptDeadline(attempt, undefined);
  if (persistenceReadyPromise === attempt) persistenceReadyPromise = null;
}

export async function ensureAuthReady() {
  if (!firebaseEnabled || !auth) return;

  await ensureAuthPersistence();
  if (auth.currentUser) return;

  if (!authReadyPromise) {
    let unsubscribe: (() => void) | null = null;
    const attempt = new Promise<void>(resolve => {
      unsubscribe = onAuthStateChanged(
        auth,
        () => { unsubscribe?.(); resolve(); },
        () => { unsubscribe?.(); resolve(); }
      );
    });
    authReadyPromise = attempt;
    void attempt.finally(() => {
      if (authReadyPromise === attempt) authReadyPromise = null;
      unsubscribe?.();
    });
  }

  const attempt = authReadyPromise;
  await authAttemptDeadline(attempt, undefined);
  if (authReadyPromise === attempt) authReadyPromise = null;
}


if (firebaseEnabled && auth) {
  void ensureAuthPersistence();
}

function isPopupFallbackError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/web-storage-unsupported' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
}

function isPopupBenignCancel(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  return code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user';
}

function parseLocalStorageRecord(value: unknown): CloudAppSnapshot['localStorage'] {
  if (!value || typeof value !== 'object') return {};
  const record: CloudAppSnapshot['localStorage'] = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue === 'string') {
      record[key as keyof CloudAppSnapshot['localStorage']] = entryValue;
    }
  }
  return record;
}

export async function googleLogin() {
  if (!firebaseEnabled || !auth) return null;
  await ensureAuthPersistence();

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    if (isPopupBenignCancel(error)) return null;
    if (isPopupFallbackError(error)) {
      await ensureAuthPersistence();
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function resolveGoogleRedirectLogin() {
  if (!firebaseEnabled || !auth) return null;
  await ensureAuthPersistence();
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export function onGoogleAuthStateChanged(listener: (user: User | null) => void) {
  if (!firebaseEnabled || !auth) {
    listener(null);
    return () => {};
  }
  void ensureAuthPersistence();
  return onAuthStateChanged(auth, listener);
}

export async function googleLogout() {
  if (!firebaseEnabled || !auth) return;
  await signOut(auth);
}

export async function pullCloudStateMetadata(userId: string): Promise<CloudStateMetadata | null> {
  if (!firebaseEnabled || !db) return null;

  const stateRef = doc(db, 'users', userId, 'app', 'state');
  const stateSnap = await getDoc(stateRef);
  if (!stateSnap.exists()) return null;

  const stateData = stateSnap.data() as {
    updatedAt?: unknown;
    localStorage?: unknown;
    revision?: unknown;
  };

  const updatedAt = typeof stateData.updatedAt === 'number' ? stateData.updatedAt : 0;
  const localStorageCount =
    stateData.localStorage && typeof stateData.localStorage === 'object'
      ? Object.keys(stateData.localStorage as object).length
      : 0;
  const revision = typeof stateData.revision === 'number' ? stateData.revision : 0;

  return {
    updatedAt,
    hasData: updatedAt > 0 || localStorageCount > 0,
    revision,
  };
}

export async function pullCloudState(userId: string): Promise<CloudAppSnapshot | null> {
  if (!firebaseEnabled || !db) return null;

  const stateRef = doc(db, 'users', userId, 'app', 'state');
  const stateSnap = await getDoc(stateRef);
  if (!stateSnap.exists()) return null;

  const stateData = stateSnap.data() as {
    updatedAt?: unknown;
    localStorage?: unknown;
  };

  return {
    version: 1,
    updatedAt: typeof stateData.updatedAt === 'number' ? stateData.updatedAt : 0,
    localStorage: parseLocalStorageRecord(stateData.localStorage),
  };
}

export async function pushCloudState(
  userId: string,
  snapshot: CloudAppSnapshot,
  expectedRevision?: number
): Promise<{ revision: number }> {
  if (!firebaseEnabled || !db) return { revision: expectedRevision ?? 0 };

  const stateRef = doc(db, 'users', userId, 'app', 'state');
  let nextRevision = 1;

  await runTransaction(db, async transaction => {
    const existingState = await transaction.get(stateRef);
    const existingData = existingState.exists()
      ? (existingState.data() as { revision?: unknown })
      : null;
    const currentRevision = typeof existingData?.revision === 'number' ? existingData.revision : 0;

    if (typeof expectedRevision === 'number' && currentRevision !== expectedRevision) {
      throw new Error('cloud-state-revision-conflict');
    }

    nextRevision = currentRevision + 1;
    transaction.set(stateRef, {
      version: 1,
      updatedAt: snapshot.updatedAt,
      revision: nextRevision,
      localStorage: snapshot.localStorage,
    });
  });

  return { revision: nextRevision };
}