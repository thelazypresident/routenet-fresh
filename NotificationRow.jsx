import React, { useState, useRef, useEffect } from 'react';
import { Bell, Pin, Trash2, BellOff, MoreVertical } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export default function NotificationRow({ 
  notification, 
  Icon, 
  isDark, 
  onPin, 
  onMute, 
  onDelete, 
  onClick,
  isMuted,
  isPinned 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isUnread = !notification.is_read;

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuAction = (action) => {
    setShowMenu(false);
    action();
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      onClick={() => onClick(notification)}
      className={`flex items-start gap-3 px-4 py-3 w-full border-b cursor-pointer relative ${
        isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
      } ${isUnread ? (isDark ? 'bg-emerald-400/10' : 'bg-emerald-500/10') : ''}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUnread 
          ? (isDark ? 'bg-[#66BB6A]/20' : 'bg-[#66BB6A]/10')
          : (isDark ? 'bg-white/5' : 'bg-gray-100')
      }`}>
        <Icon className={`w-5 h-5 ${
          isUnread 
            ? (isDark ? 'text-[#66BB6A]' : 'text-[#0B3D2E]')
            : (isDark ? 'text-white/40' : 'text-gray-400')
        }`} />
      </div>

      {/* Middle: Title + Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {isPinned && (
            <Pin className={`flex-shrink-0 w-3.5 h-3.5 ${isDark ? 'text-[#66BB6A]' : 'text-[#0B3D2E]'} fill-current`} />
          )}
          <h3 className={`text-sm truncate flex-1 ${
            isUnread 
              ? (isDark ? 'text-white font-bold' : 'text-gray-900 font-bold')
              : (isDark ? 'text-white/70 font-normal' : 'text-gray-600 font-normal')
          }`}>
            {notification.title}
          </h3>
        </div>
        <p className={`text-xs line-clamp-2 ${
          isUnread
            ? (isDark ? 'text-white/60' : 'text-gray-600')
            : (isDark ? 'text-white/40' : 'text-gray-500')
        }`}>
          {/* FIX: SQLite notification_log stores the description field as 'body'.
              Base44 Notification records use 'message'. Check both so the
              notification body text renders correctly whether the source is
              SQLite (offline) or Base44 (online). */}
          {notification.body ?? notification.message ?? ''}
        </p>
        {notification.priority === 'high' && (
          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">
            Urgent
          </span>
        )}
      </div>

      {/* Right: Time + Status Icons + More Button */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="flex flex-col items-end gap-1">
          <div className={`text-[11px] ${
            isUnread
              ? (isDark ? 'text-white/50' : 'text-gray-500')
              : (isDark ? 'text-white/30' : 'text-gray-400')
          }`}>
            {formatRelativeTime(notification.scheduled_for || notification.created_date || notification.created_at)}
          </div>
          {isMuted && (
            <BellOff className={`w-3.5 h-3.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
          )}
        </div>
        
        {/* More Menu Button */}
        <button
          onClick={handleMoreClick}
          className={`p-1.5 rounded-full transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
          }`}
        >
          <MoreVertical className={`w-4 h-4 ${
            isDark ? 'text-white/60' : 'text-gray-500'
          }`} />
        </button>
      </div>

      {/* Action Menu */}
      {showMenu && (
        <div 
          ref={menuRef}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-lg shadow-2xl border ${
            isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
          }`}
          style={{ minWidth: '140px' }}
        >
          <button
            onClick={() => handleMenuAction(() => onMute(notification))}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
              isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-50 text-gray-900'
            } rounded-t-lg`}
          >
            {isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={() => handleMenuAction(() => onPin(notification))}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-t ${
              isDark ? 'hover:bg-white/5 text-white border-white/10' : 'hover:bg-gray-50 text-gray-900 border-gray-100'
            }`}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            <span>{isPinned ? 'Unpin' : 'Pin'}</span>
          </button>
          <button
            onClick={() => handleMenuAction(() => onDelete(notification))}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-t ${
              isDark ? 'hover:bg-red-900/20 text-red-400 border-white/10' : 'hover:bg-red-50 text-red-600 border-gray-100'
            } rounded-b-lg`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
