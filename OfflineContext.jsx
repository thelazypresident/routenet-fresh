import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { safeGetDb } from '@/database/db';

const OfflineContext = createContext(null);

const CACHE_PREFIX = 'routenet_cache_';

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const mountedRef = useRef(true);
  const bootedRef = useRef(false);
  const listenerRef = useRef(null);
  const syncCheckTimerRef = useRef(null);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // FIX: queueCount and isSyncing were read by OfflineIndicator via useOffline()
  // but were never defined or exposed in this context — causing the indicator
  // to always show undefined/0 and the syncing spinner to never appear.
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Reads the count of pending (unsynced) records across all SQLite tables
  // so OfflineIndicator can show "3 pending" accurately.
  const refreshQueueCount = useCallback(async () => {
    try {
      const db = await safeGetDb();
      if (!db) {
        setQueueCount(0);
        return;
      }

      // Count pending records across all tables that sync
      const tables = [
        'transactions',
        'savings_goals',
        'expense_limits',
        'renewal_reminders',
        'maintenance',
      ];

      const userEmail = window.__routenet_user_email__;
      if (!userEmail) {
        setQueueCount(0);
        return;
      }

      let total = 0;
      for (const table of tables) {
        try {
          const result = await db.query(
            `SELECT COUNT(*) as count FROM ${table}
             WHERE created_by = ? AND sync_status = 'pending'`,
            [userEmail]
          );
          total += result.values?.[0]?.count ?? 0;
        } catch (e) {
          // Table may not exist yet on first boot — safe to skip
        }
      }

      if (mountedRef.current) {
        setQueueCount(total);
      }
    } catch (e) {
      console.warn('[OfflineContext] refreshQueueCount failed:', e);
    }
  }, []);

  const safeSetOnline = useCallback((value) => {
    if (mountedRef.current) {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = value;
      setIsOnline(value);

      // Trigger sync when connection is restored
      if (wasOffline && value) {
        setIsSyncing(true);

        import('@/services/syncService').then(({ syncAll }) => {
          const userEmail = window.__routenet_user_email__;
          if (userEmail) {
            syncAll(userEmail)
              .catch(e => console.error('[OfflineContext] syncAll failed:', e))
              .finally(() => {
                if (mountedRef.current) {
                  setIsSyncing(false);
                  // Refresh count after sync so indicator clears
                  refreshQueueCount();
                }
              });
          } else {
            if (mountedRef.current) setIsSyncing(false);
          }
        }).catch(() => {
          if (mountedRef.current) setIsSyncing(false);
        });
      }
    }
  }, [refreshQueueCount]);

  // Cache a data entity to Capacitor Preferences (persistent local storage)
  const cacheEntityData = useCallback(async (key, data) => {
    try {
      await Preferences.set({
        key: `${CACHE_PREFIX}${key}`,
        value: JSON.stringify(data ?? null),
      });
    } catch (error) {
      console.error('[OfflineContext] cacheEntityData failed:', error);
    }
  }, []);

  // Retrieve a cached data entity from Capacitor Preferences
  const getCachedEntityData = useCallback(async (key) => {
    try {
      const { value } = await Preferences.get({
        key: `${CACHE_PREFIX}${key}`,
      });

      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error('[OfflineContext] getCachedEntityData failed:', error);
      return null;
    }
  }, []);

  // Remove a single cached entity
  const removeCachedEntityData = useCallback(async (key) => {
    try {
      await Preferences.remove({
        key: `${CACHE_PREFIX}${key}`,
      });
    } catch (error) {
      console.error('[OfflineContext] removeCachedEntityData failed:', error);
    }
  }, []);

  // Wipe all cached entity data (e.g. on logout)
  const clearAllCachedEntityData = useCallback(async () => {
    try {
      const { keys } = await Preferences.keys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

      await Promise.all(
        cacheKeys.map((key) =>
          Preferences.remove({ key })
        )
      );
    } catch (error) {
      console.error('[OfflineContext] clearAllCachedEntityData failed:', error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // bootedRef prevents this effect from running twice in React Strict Mode
    if (bootedRef.current) {
      return () => {
        mountedRef.current = false;
      };
    }

    bootedRef.current = true;

    const initNetwork = async () => {
      // 1. Get initial network status from Capacitor
      try {
        const status = await Network.getStatus();
        safeSetOnline(!!status.connected);
      } catch (error) {
        console.error('[OfflineContext] Network.getStatus failed:', error);
        safeSetOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      }

      // 2. Register Capacitor network change listener (works in native app)
      try {
        const listener = await Network.addListener('networkStatusChange', (status) => {
          safeSetOnline(!!status.connected);
        });
        listenerRef.current = listener;
      } catch (error) {
        console.error('[OfflineContext] Network listener failed:', error);
      }

      // 3. Initial queue count — refresh after a short delay to allow
      // SQLite to finish initializing from AppContext bootApp()
      setTimeout(() => {
        if (mountedRef.current) refreshQueueCount();
      }, 2000);

      // 4. Poll queue count every 30s so OfflineIndicator stays accurate
      // without hammering SQLite on every render
      syncCheckTimerRef.current = setInterval(() => {
        if (mountedRef.current) refreshQueueCount();
      }, 30000);
    };

    // 5. Also listen to browser online/offline events (web/PWA fallback)
    const handleOnline = () => safeSetOnline(true);
    const handleOffline = () => safeSetOnline(false);

    initNetwork();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (listenerRef.current?.remove) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }

      if (syncCheckTimerRef.current) {
        clearInterval(syncCheckTimerRef.current);
        syncCheckTimerRef.current = null;
      }
    };
  }, [safeSetOnline, refreshQueueCount]);

  // FIX: Added queueCount, isSyncing, and refreshQueueCount to context value.
  // OfflineIndicator reads all three — they were previously undefined because
  // they were never exposed here, making the indicator always show nothing.
  const value = useMemo(() => {
    return {
      isOnline,
      isSyncing,
      queueCount,
      refreshQueueCount,
      cacheEntityData,
      getCachedEntityData,
      removeCachedEntityData,
      clearAllCachedEntityData,
    };
  }, [
    isOnline,
    isSyncing,
    queueCount,
    refreshQueueCount,
    cacheEntityData,
    getCachedEntityData,
    removeCachedEntityData,
    clearAllCachedEntityData,
  ]);

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
