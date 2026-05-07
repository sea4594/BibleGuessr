'use client';

/* eslint-disable react-hooks/preserve-manual-memoization */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  exportLocalAppSnapshot,
  exportLocalAppSnapshotMetadata,
  hasLocalAppSnapshotData,
  importLocalAppSnapshot,
  mergeSnapshots,
  type LocalAppSnapshot,
} from './appStateSync';
import {
  getLocalDataOwnerId,
  readLocalDataUpdatedAt,
  setLocalDataOwnerId,
} from './localDataState';
import { onCloudSyncNeeded, notifyStorageRefreshNeeded } from './syncSignal';
import {
  firebaseEnabled,
  googleLogin,
  googleLogout,
  onGoogleAuthStateChanged,
  pullCloudState,
  pullCloudStateMetadata,
  pushCloudState,
  resolveGoogleRedirectLogin,
} from './firebaseClient';

type SyncStatus = 'idle' | 'syncing' | 'error';

const CLOUD_RECONCILE_INTERVAL_MS = 45_000;

type AccountSyncContextValue = {
  ready: boolean;
  firebaseEnabled: boolean;
  user: User | null;
  syncStatus: SyncStatus;
  syncError: string;
  appStateNonce: number;
  loginPending: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AccountSyncContext = createContext<AccountSyncContextValue | null>(null);

function sameLocalStorageSnapshot(
  a: LocalAppSnapshot['localStorage'],
  b: LocalAppSnapshot['localStorage']
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (a[key as keyof typeof a] !== b[key as keyof typeof b]) return false;
  }

  return true;
}

function snapshotNeedsLocalApply(local: LocalAppSnapshot, merged: LocalAppSnapshot): boolean {
  if (local.updatedAt !== merged.updatedAt) return true;
  if (!sameLocalStorageSnapshot(local.localStorage, merged.localStorage)) return true;
  return false;
}

function makeEmptySnapshot(): LocalAppSnapshot {
  return {
    version: 1,
    updatedAt: 0,
    localStorage: {},
  };
}

function isCloudRevisionConflict(error: unknown): boolean {
  return error instanceof Error && error.message === 'cloud-state-revision-conflict';
}

function errorCodeOf(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

function isLikelyOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const code = errorCodeOf(error).toLowerCase();
  if (code.includes('network') || code.includes('unavailable') || code.includes('timeout')) return true;

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('unavailable')
  );
}

function describeSyncError(error: unknown): string {
  if (isLikelyOfflineError(error)) {
    return 'Cloud sync is temporarily unavailable (offline/network issue). Local data remains available and will sync when connection is restored.';
  }

  const message = error instanceof Error ? error.message : String(error);
  if (!message.trim()) {
    return 'Cloud sync failed. Local data remains available on this device.';
  }

  return `Cloud sync failed: ${message}. Local data remains available on this device.`;
}

export function AccountSyncProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [ready, setReady] = useState(!firebaseEnabled);
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');
  const [appStateNonce, setAppStateNonce] = useState(0);
  const [loginPending, setLoginPending] = useState(false);

  const initializedUserIdRef = useRef<string | null>(null);
  const readyRef = useRef(ready);
  const syncTimeoutRef = useRef<number | null>(null);
  const syncInFlightRef = useRef(false);
  const syncRequestedRef = useRef(false);
  const reconcileInFlightRef = useRef(false);
  const reconcileRequestedRef = useRef(false);
  const restoringRef = useRef(false);
  const initializingForUidRef = useRef<string | null>(null);
  const loginInFlightRef = useRef(false);
  const lastSuccessfulSyncAtRef = useRef(0);
  const cloudMetadataUpdatedAtRef = useRef(0);
  const cloudRevisionRef = useRef(0);

  const clearScheduledSync = useCallback(() => {
    if (syncTimeoutRef.current != null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  const updateCloudSyncPointers = useCallback(
    (updatedAt: number, revision = cloudRevisionRef.current) => {
    lastSuccessfulSyncAtRef.current = updatedAt;
    cloudMetadataUpdatedAtRef.current = updatedAt;
    cloudRevisionRef.current = revision;
    },
    []
  );

  const uploadLocalSnapshot = useCallback(async (activeUser: User) => {
    const localSnapshot = await exportLocalAppSnapshot();
    const result = await pushCloudState(activeUser.uid, localSnapshot, cloudRevisionRef.current);
    updateCloudSyncPointers(localSnapshot.updatedAt, result.revision);
  }, [updateCloudSyncPointers]);

  const reconcileLocalAndCloud = useCallback(async (activeUser: User) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const [cloudMetadata, cloudSnapshot, localSnapshot] = await Promise.all([
          pullCloudStateMetadata(activeUser.uid),
          pullCloudState(activeUser.uid),
          exportLocalAppSnapshot(),
        ]);

        const expectedRevision = cloudMetadata?.revision ?? 0;

        if (!cloudSnapshot && hasLocalAppSnapshotData(localSnapshot)) {
          const result = await pushCloudState(activeUser.uid, localSnapshot, expectedRevision);
          updateCloudSyncPointers(localSnapshot.updatedAt, result.revision);
          return;
        }

        if (cloudSnapshot && !hasLocalAppSnapshotData(localSnapshot)) {
          await importLocalAppSnapshot(cloudSnapshot, false);
          updateCloudSyncPointers(cloudSnapshot.updatedAt, expectedRevision);
          notifyStorageRefreshNeeded();
          setAppStateNonce(n => n + 1);
          return;
        }

        if (!cloudSnapshot) {
          updateCloudSyncPointers(0, expectedRevision);
          return;
        }

        const merged = mergeSnapshots(localSnapshot, cloudSnapshot);
        if (snapshotNeedsLocalApply(localSnapshot, merged)) {
          await importLocalAppSnapshot(merged, false);
          notifyStorageRefreshNeeded();
          setAppStateNonce(n => n + 1);
        }

        const result = await pushCloudState(activeUser.uid, merged, expectedRevision);
        updateCloudSyncPointers(merged.updatedAt, result.revision);
        return;
      } catch (error) {
        if (isCloudRevisionConflict(error) && attempt < 2) continue;
        throw error;
      }
    }
  }, [updateCloudSyncPointers]);

  const reconcileCloudUpdates = useCallback(async (activeUser: User, force = false) => {
    if (syncInFlightRef.current || restoringRef.current) {
      reconcileRequestedRef.current = true;
      return;
    }

    if (reconcileInFlightRef.current) {
      reconcileRequestedRef.current = true;
      return;
    }

    reconcileInFlightRef.current = true;

    try {
      const cloudMetadata = await pullCloudStateMetadata(activeUser.uid);
      if (!cloudMetadata || !cloudMetadata.hasData) {
        if (readLocalDataUpdatedAt() > lastSuccessfulSyncAtRef.current) {
          setSyncStatus('syncing');
          setSyncError('');
          await uploadLocalSnapshot(activeUser);
          setSyncStatus('idle');
        } else {
          updateCloudSyncPointers(0, 0);
        }
        return;
      }

      const remoteChanged =
        cloudMetadata.revision > cloudRevisionRef.current ||
        cloudMetadata.updatedAt > cloudMetadataUpdatedAtRef.current;

      if (!force && !remoteChanged) {
        cloudMetadataUpdatedAtRef.current = cloudMetadata.updatedAt;
        cloudRevisionRef.current = cloudMetadata.revision;
        return;
      }

      cloudMetadataUpdatedAtRef.current = cloudMetadata.updatedAt;
      cloudRevisionRef.current = cloudMetadata.revision;
      setSyncStatus('syncing');
      setSyncError('');
      await reconcileLocalAndCloud(activeUser);
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      setSyncError(describeSyncError(error));
    } finally {
      reconcileInFlightRef.current = false;
      if (reconcileRequestedRef.current) {
        reconcileRequestedRef.current = false;
        window.setTimeout(() => {
          void reconcileCloudUpdates(activeUser);
        }, 350);
      }
    }
  }, [reconcileLocalAndCloud, updateCloudSyncPointers, uploadLocalSnapshot]);

  const initializeUserState = useCallback(async (activeUser: User) => {
    if (initializingForUidRef.current === activeUser.uid) return;

    initializingForUidRef.current = activeUser.uid;
    restoringRef.current = true;
    setReady(false);
    setSyncError('');
    setSyncStatus('syncing');

    try {
      const [cloudMetadata, localMetadata] = await Promise.all([
        pullCloudStateMetadata(activeUser.uid),
        exportLocalAppSnapshotMetadata(),
      ]);

      const localOwnerId = getLocalDataOwnerId();
      const localBelongsToOtherAccount = localOwnerId !== null && localOwnerId !== activeUser.uid;
      const localLikelyHasData = localMetadata.hasData;
      const cloudLikelyHasData = Boolean(cloudMetadata?.hasData);

      if (localBelongsToOtherAccount) {
        if (!cloudLikelyHasData) {
          const empty = makeEmptySnapshot();
          await importLocalAppSnapshot(empty, false);
          updateCloudSyncPointers(0, 0);
        } else {
          const cloudSnapshot = await pullCloudState(activeUser.uid);
          const safeCloud = cloudSnapshot ?? makeEmptySnapshot();
          await importLocalAppSnapshot(safeCloud, false);
          updateCloudSyncPointers(safeCloud.updatedAt, cloudMetadata?.revision ?? 0);
        }
        notifyStorageRefreshNeeded();
        setAppStateNonce(n => n + 1);
      } else if (!cloudMetadata || !cloudLikelyHasData) {
        if (localLikelyHasData) {
          await uploadLocalSnapshot(activeUser);
        } else {
          updateCloudSyncPointers(cloudMetadata?.updatedAt ?? 0, cloudMetadata?.revision ?? 0);
        }
      } else if (!localLikelyHasData) {
        const cloudSnapshot = await pullCloudState(activeUser.uid);
        const safeCloud = cloudSnapshot ?? makeEmptySnapshot();
        await importLocalAppSnapshot(safeCloud, false);
        updateCloudSyncPointers(safeCloud.updatedAt, cloudMetadata.revision);
        notifyStorageRefreshNeeded();
        setAppStateNonce(n => n + 1);
      } else {
        await reconcileLocalAndCloud(activeUser);
      }

      setLocalDataOwnerId(activeUser.uid);
      initializedUserIdRef.current = activeUser.uid;
      setSyncStatus('idle');
      setReady(true);
    } catch (error) {
      setSyncStatus('error');
      setSyncError(describeSyncError(error));
      setReady(true);
    } finally {
      initializingForUidRef.current = null;
      restoringRef.current = false;
    }
  }, [reconcileLocalAndCloud, updateCloudSyncPointers, uploadLocalSnapshot]);

  const flushSync = useCallback(async () => {
    clearScheduledSync();
    if (!user || !ready || restoringRef.current) return;

    if (syncInFlightRef.current) {
      syncRequestedRef.current = true;
      return;
    }

    syncInFlightRef.current = true;
    syncRequestedRef.current = false;
    setSyncStatus('syncing');
    setSyncError('');

    try {
      await reconcileLocalAndCloud(user);
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      setSyncError(describeSyncError(error));
    } finally {
      syncInFlightRef.current = false;
      if (syncRequestedRef.current) {
        syncRequestedRef.current = false;
        syncTimeoutRef.current = window.setTimeout(() => {
          void flushSync();
        }, 800);
      }
    }
  }, [clearScheduledSync, ready, reconcileLocalAndCloud, user]);

  const scheduleSync = useCallback(() => {
    if (!user || !ready || restoringRef.current) return;

    syncRequestedRef.current = true;
    clearScheduledSync();
    syncTimeoutRef.current = window.setTimeout(() => {
      void flushSync();
    }, 800);
  }, [clearScheduledSync, flushSync, ready, user]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    if (!firebaseEnabled) return;

    let cancelled = false;

    const unsubscribe = onGoogleAuthStateChanged(nextUser => {
      if (cancelled) return;

      setUser(nextUser);
      clearScheduledSync();
      syncRequestedRef.current = false;

      if (!nextUser) {
        initializedUserIdRef.current = null;
        updateCloudSyncPointers(0, 0);
        setSyncStatus('idle');
        setSyncError('');
        setReady(true);
        return;
      }

      if (initializedUserIdRef.current === nextUser.uid && readyRef.current) return;
      void initializeUserState(nextUser);
    });

    void (async () => {
      try {
        const redirectUser = await resolveGoogleRedirectLogin();
        if (cancelled || !redirectUser) return;

        setUser(redirectUser);
        if (initializedUserIdRef.current === redirectUser.uid && readyRef.current) return;
        await initializeUserState(redirectUser);
      } catch (error) {
        if (cancelled) return;
        setSyncStatus('error');
        setSyncError(`Google login redirect failed: ${describeSyncError(error)}`);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearScheduledSync();
      unsubscribe();
    };
  }, [clearScheduledSync, initializeUserState, updateCloudSyncPointers]);

  useEffect(() => {
    if (!firebaseEnabled || !user || !ready) return;
    return onCloudSyncNeeded(() => {
      scheduleSync();
    });
  }, [ready, scheduleSync, user]);

  useEffect(() => {
    if (!firebaseEnabled || !user || !ready) return;

    const handleOnline = () => {
      void reconcileCloudUpdates(user);
      if (readLocalDataUpdatedAt() > lastSuccessfulSyncAtRef.current) {
        scheduleSync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [ready, reconcileCloudUpdates, scheduleSync, user]);

  useEffect(() => {
    if (!firebaseEnabled || !user || !ready) return;

    void reconcileCloudUpdates(user);

    const handleFocus = () => {
      void reconcileCloudUpdates(user);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void reconcileCloudUpdates(user);
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void reconcileCloudUpdates(user);
      }
    }, CLOUD_RECONCILE_INTERVAL_MS);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [ready, reconcileCloudUpdates, user]);

  const value = useMemo<AccountSyncContextValue>(
    () => ({
      ready,
      firebaseEnabled,
      user,
      syncStatus,
      syncError,
      appStateNonce,
      loginPending,
      login: async () => {
        if (loginInFlightRef.current) return;
        setSyncError('');
        loginInFlightRef.current = true;
        setLoginPending(true);
        try {
          await googleLogin();
        } finally {
          loginInFlightRef.current = false;
          setLoginPending(false);
        }
      },
      logout: async () => {
        clearScheduledSync();
        syncRequestedRef.current = false;
        await googleLogout();
      },
    }),
    [appStateNonce, clearScheduledSync, loginPending, ready, syncError, syncStatus, user]
  );

  return <AccountSyncContext.Provider value={value}>{children}</AccountSyncContext.Provider>;
}

export function useAccountSync() {
  const context = useContext(AccountSyncContext);
  if (!context) throw new Error('useAccountSync must be used within AccountSyncProvider');
  return context;
}
