import {
  applySyncedLocalStorage,
  markLocalDataChanged,
  readLocalDataUpdatedAt,
  readSyncedLocalStorage,
  type SyncedLocalStorageKey,
} from './localDataState';

const APP_SNAPSHOT_IMPORTED_EVENT = 'bg:app-snapshot-imported';

export type LocalAppSnapshot = {
  version: 1;
  updatedAt: number;
  localStorage: Partial<Record<SyncedLocalStorageKey, string>>;
};

export type LocalAppSnapshotMetadata = {
  updatedAt: number;
  localStorageCount: number;
  hasData: boolean;
};

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

export async function exportLocalAppSnapshotMetadata(): Promise<LocalAppSnapshotMetadata> {
  const localStorage = readSyncedLocalStorage();
  const localStorageCount = Object.keys(localStorage).length;
  const updatedAt = readLocalDataUpdatedAt();

  return {
    updatedAt,
    localStorageCount,
    hasData: updatedAt > 0 || localStorageCount > 0,
  };
}

export async function exportLocalAppSnapshot(): Promise<LocalAppSnapshot> {
  const localStorage = readSyncedLocalStorage();
  return {
    version: 1,
    updatedAt: readLocalDataUpdatedAt(),
    localStorage,
  };
}

export async function importLocalAppSnapshot(snapshot: LocalAppSnapshot, notify = false) {
  applySyncedLocalStorage(snapshot.localStorage, snapshot.updatedAt, false);
  markLocalDataChanged(snapshot.updatedAt, notify);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(APP_SNAPSHOT_IMPORTED_EVENT));
  }
}

export function onLocalAppSnapshotImported(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(APP_SNAPSHOT_IMPORTED_EVENT, listener);
  return () => window.removeEventListener(APP_SNAPSHOT_IMPORTED_EVENT, listener);
}

export function hasLocalAppSnapshotData(snapshot: LocalAppSnapshot): boolean {
  return snapshot.updatedAt > 0 || Object.keys(snapshot.localStorage).length > 0;
}

export function mergeSnapshots(local: LocalAppSnapshot, cloud: LocalAppSnapshot): LocalAppSnapshot {
  const useLocalSettings = local.updatedAt >= cloud.updatedAt;
  const localStorage = useLocalSettings ? local.localStorage : cloud.localStorage;
  const updatedAt = Math.max(local.updatedAt, cloud.updatedAt);

  if (sameLocalStorageSnapshot(local.localStorage, cloud.localStorage)) {
    return {
      version: 1,
      updatedAt,
      localStorage: local.localStorage,
    };
  }

  return {
    version: 1,
    updatedAt,
    localStorage,
  };
}
