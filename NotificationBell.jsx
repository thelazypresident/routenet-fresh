import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApp } from './contexts/AppContext';
import { getUnreadNotificationCount } from '@/database/genericRepository';
import { createPageUrl } from '../utils';

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, user } = useApp();

  const isDark = theme === 'dark';

  // Local-first unread count so the bell updates immediately when a notification
  // is delivered to the device, regardless of whether the app is online or offline.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-bell'],
    queryFn: async () => {
      return await getUnreadNotificationCount();
    },
    enabled: true,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    initialData: 0,
  });

  const handleClick = () => {
    const targetPath = createPageUrl('Notifications');
    if (location.pathname === targetPath) return;
    navigate(targetPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
        isDark
          ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
      }`}
      aria-label="Open notifications"
    >
      <Bell className="w-4 h-4" />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
