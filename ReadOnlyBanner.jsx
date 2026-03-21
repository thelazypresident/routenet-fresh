import React from 'react';
import { Lock } from 'lucide-react';
import { useApp } from './contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ReadOnlyBanner() {
  const { theme } = useApp();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div 
      onClick={() => navigate(createPageUrl('Subscription'))}
      className={`cursor-pointer py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50' 
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 hover:border-amber-400'
      }`}
    >
      <Lock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
          Read-only mode
        </p>
        <p className={`text-[10px] ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
          Upgrade to keep tracking
        </p>
      </div>
      <div className={`text-[10px] font-bold px-2 py-1 rounded ${
        isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-200 text-amber-800'
      }`}>
        Upgrade
      </div>
    </div>
  );
}