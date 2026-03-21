import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function PeriodSelector({ activePeriod, onPeriodChange }) {
  const { t, theme } = useApp();

  const isDark = theme === 'dark';

  const periods = [
    { id: 'daily', label: t('DAILY') },
    { id: 'weekly', label: t('WEEKLY') },
    { id: 'monthly', label: t('MONTHLY') },
    { id: 'yearly', label: 'Yearly' },
    { id: 'calendar', label: t('CALENDAR'), icon: CalendarIcon }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {periods.map((period) => {
        const isActive = activePeriod === period.id;
        const Icon = period.icon;

        return (
          <button
            key={period.id}
            onClick={() => onPeriodChange(period.id)}
            className={`px-4 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
              isActive
                ? 'period-btn-active'
                : isDark
                ? 'period-btn-inactive'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {Icon ? (
              <div className="flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" />
                <span>{period.label}</span>
              </div>
            ) : (
              period.label
            )}
          </button>
        );
      })}
    </div>
  );
}