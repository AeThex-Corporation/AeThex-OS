import { useState, useEffect, useCallback } from 'react';

export interface SyncQueueItem {
  id: string;
  type: string;
  action: string;
  payload: any;
  timestamp: number;
  synced: boolean;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('aethex-sync-queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist queue to localStorage
  useEffect(() => {
    localStorage.setItem('aethex-sync-queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [isOnline]);

  const addToQueue = useCallback((type: string, action: string, payload: any) => {
    const item: SyncQueueItem = {
      id: `${type}-${Date.now()}`,
      type,
      action,
      payload,
      timestamp: Date.now(),
      synced: false,
    };

    setSyncQueue(prev => [...prev, item]);
    return item;
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    const unsynced = syncQueue.filter(item => !item.synced);

    for (const item of unsynced) {
      try {
        // Send to server
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (res.ok) {
          setSyncQueue(prev =>
            prev.map(i => i.id === item.id ? { ...i, synced: true } : i)
          );
        }
      } catch (err) {
        console.error('[Sync Error]', item.id, err);
      }
    }

    setIsSyncing(false);
  }, [syncQueue, isOnline, isSyncing]);

  const clearSynced = useCallback(() => {
    setSyncQueue(prev => prev.filter(item => !item.synced));
  }, []);

  return {
    isOnline,
    syncQueue,
    isSyncing,
    addToQueue,
    processSyncQueue,
    clearSynced,
  };
}
