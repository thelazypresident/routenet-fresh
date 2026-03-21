import React from 'react';
import { WifiOff, RefreshCw, Check } from 'lucide-react';
import { useOffline } from './contexts/OfflineContext';
import { useApp } from './contexts/AppContext';

export default function OfflineIndicator() {
  const { isOnline, isSyncing, queueCount } = useOffline();
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (isOnline && !isSyncing && queueCount === 0) {
    return null;
  }

  return (
    <div
  className={`fixed top-16 left-0 right-0 z-40 px-4 py-2 ${
    isDark ? 'bg-yellow-900/90 border-yellow-700' : 'bg-yellow-100 border-yellow-300'
  } border-b backdrop-blur-sm`}
  style={{ pointerEvents: 'none' }}
>
      <div className="max-w-screen-lg mx-auto flex items-center justify-center gap-2">
        {!isOnline && (
          <>
            <WifiOff className={`w-4 h-4 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`} />
            <p className={`text-xs font-medium ${isDark ? 'text-yellow-100' : 'text-yellow-800'}`}>
              Offline Mode {queueCount > 0 && `• ${queueCount} pending action${queueCount > 1 ? 's' : ''}`}
            </p>
          </>
        )}
        
        {isOnline && isSyncing && (
          <>
            <RefreshCw className={`w-4 h-4 animate-spin ${isDark ? 'text-blue-300' : 'text-blue-700'}`} />
            <p className={`text-xs font-medium ${isDark ? 'text-blue-100' : 'text-blue-800'}`}>
              Syncing offline changes...
            </p>
          </>
        )}
        
        {isOnline && !isSyncing && queueCount > 0 && (
          <>
            <Check className={`w-4 h-4 ${isDark ? 'text-green-300' : 'text-green-700'}`} />
            <p className={`text-xs font-medium ${isDark ? 'text-green-100' : 'text-green-800'}`}>
              Sync complete
            </p>
          </>
        )}
      </div>
    </div>
  );
}