type SyncListener = () => void;

const syncListeners = new Set<SyncListener>();
const refreshListeners = new Set<SyncListener>();

export function onCloudSyncNeeded(listener: SyncListener) {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function notifyCloudSyncNeeded() {
  for (const listener of syncListeners) {
    try {
      listener();
    } catch {
      // Do not fail other listeners if one throws.
    }
  }
}

export function onStorageRefreshNeeded(listener: SyncListener) {
  refreshListeners.add(listener);
  return () => {
    refreshListeners.delete(listener);
  };
}

export function notifyStorageRefreshNeeded() {
  for (const listener of refreshListeners) {
    try {
      listener();
    } catch {
      // Do not fail other listeners if one throws.
    }
  }
}
