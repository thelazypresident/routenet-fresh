import React from 'react';
import { User, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { createPageUrl } from '../utils';

export default function UserAccount() {
  const navigate = useNavigate();
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const menuItems = [
    {
      icon: User,
      label: 'Profile Information',
      onClick: () => navigate(createPageUrl('ProfileSettings'))
    },
    {
      icon: Star,
      label: t('SUBSCRIPTION'),
      onClick: () => navigate(createPageUrl('Subscription'))
    }
  ];

  return (
    <div className={`min-h-screen pb-20 ${
      isDark 
        ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]' 
        : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
    }`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0B3D2E] via-[#66BB6A] to-[#A5D6A7] h-14 flex items-center shadow-lg">
        <h1 className="text-lg font-bold ml-3 text-white">
          User Account
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">

        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                isDark 
                  ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/20' 
                  : 'bg-white/60 hover:bg-white/80 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.label}
                </span>
              </div>
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}