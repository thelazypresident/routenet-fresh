import React from 'react';
import { Bell } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ReminderBanner({ reminderType, daysRemaining }) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!reminderType) return null;

  const getMessage = () => {
    if (reminderType === 'trial') {
      return `Free trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
    }

    if (reminderType === 'monthly') {
      return `Monthly subscription renews in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
    }

    if (reminderType === 'yearly') {
      return `Yearly subscription renews in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
    }

    return `Reminder in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
  };

  const getButtonText = () => {
    if (reminderType === 'trial') return 'View Premium';
    return 'Manage';
  };

  const getButtonLink = () => {
    return createPageUrl('Subscription');
  };

  return (
    <div
      className={`rounded-xl py-2 px-3 shadow-sm flex items-center justify-between gap-3 ${
        isDark
          ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border border-yellow-700/30'
          : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Bell className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
        <p className={`text-xs font-medium truncate ${isDark ? 'text-yellow-100' : 'text-yellow-900'}`}>
          {getMessage()}
        </p>
      </div>

      <Link to={getButtonLink()}>
        <button
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            isDark
              ? 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          {getButtonText()}
        </button>
      </Link>
    </div>
  );
}