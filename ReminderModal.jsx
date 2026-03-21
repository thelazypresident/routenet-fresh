import React from 'react';
import { Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ReminderModal({ open, onClose, reminderType, daysRemaining }) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!open || !reminderType) return null;

  const getTitle = () => {
    if (reminderType === 'trial') return 'Trial Ending Soon';
    if (reminderType === 'monthly') return 'Monthly Renewal Coming';
    if (reminderType === 'yearly') return 'Yearly Renewal Coming';
    return 'Reminder';
  };

  const getDescription = () => {
    if (reminderType === 'trial') {
      return `Your free trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. Upgrade to continue enjoying premium features.`;
    }

    if (reminderType === 'monthly') {
      return `Your monthly subscription renews in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. You can manage your subscription anytime.`;
    }

    if (reminderType === 'yearly') {
      return `Your yearly subscription renews in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. You can manage your subscription anytime.`;
    }

    return `Reminder in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.`;
  };

  const getPrimaryText = () => {
    if (reminderType === 'trial') return 'Go Premium';
    return 'Manage Subscription';
  };

  const handlePrimaryAction = () => {
    onClose?.();
  };

  const handleSecondaryAction = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className={`w-full max-w-[280px] rounded-xl shadow-xl p-4 ${
          isDark ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white'
        }`}
      >
        <div className="flex justify-center mb-2">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isDark ? 'bg-yellow-400/20' : 'bg-yellow-100'
            }`}
          >
            <Clock className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
        </div>

        <h3
          className={`text-center text-sm font-bold mb-1.5 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {getTitle()}
        </h3>

        <p
          className={`text-center text-xs mb-3 leading-tight ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`}
        >
          {getDescription()}
        </p>

        <div className="space-y-1.5">
          <Link to={createPageUrl('Subscription')} className="block">
            <button
              onClick={handlePrimaryAction}
              className="w-full py-2 rounded-lg font-semibold text-xs bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black hover:opacity-90 transition-opacity"
            >
              {getPrimaryText()}
            </button>
          </Link>

          <button
            onClick={handleSecondaryAction}
            className={`w-full py-2 rounded-lg font-medium text-xs transition-colors ${
              isDark
                ? 'text-white/90 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}