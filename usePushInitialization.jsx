import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { initNativePush } from '../utils/push/nativePushOneSignal';

export function usePushInitialization(user) {
  useEffect(() => {
    if (!user?.email) return;

    const initPush = async () => {
      try {
        // Initialize native push for Capacitor/APK
        await initNativePush({ userId: user.email });
      } catch (error) {
        console.error('[PushInit] Error:', error);
      }
    };

    initPush();
  }, [user?.email]);
}