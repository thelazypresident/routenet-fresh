import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Wrench, DollarSign } from 'lucide-react';
import { useApp } from './contexts/AppContext';
import { createPageUrl } from '../utils';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useApp();

  const isDark = theme === 'dark';

  const tabs = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'Transactions', icon: Receipt, label: 'Transactions' },
    { id: 'Savings', icon: PieChart, label: 'Savings Goals' },
    { id: 'Utilities', icon: Wrench, label: 'Maintenance & Renewals' },
    { id: 'FinanceData', icon: DollarSign, label: 'Analytics' }
  ];

  const isActive = (tabId) => {
    const targetPath = createPageUrl(tabId);
    return location.pathname === targetPath;
  };

  const handleNavigation = (tabId) => {
    const targetPath = createPageUrl(tabId);

    if (location.pathname === targetPath) {
      return;
    }

    navigate(targetPath);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] ${
        isDark ? 'bg-[#0a0a0a] border-t border-white/10' : 'bg-white border-t border-gray-200'
      }`}
    >
      <div className="flex items-center justify-around h-20 max-w-screen-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNavigation(tab.id)}
              className="flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-0.5 px-1"
              style={{ touchAction: 'manipulation' }}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  active
                    ? isDark
                      ? 'text-[#66BB6A]'
                      : 'text-[#0B3D2E]'
                    : isDark
                      ? 'text-white/40'
                      : 'text-gray-400'
                }`}
              />
              <span
                className={`text-[9px] leading-tight text-center line-clamp-2 ${
                  active
                    ? isDark
                      ? 'text-[#66BB6A]'
                      : 'text-[#0B3D2E]'
                    : isDark
                      ? 'text-white/40'
                      : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}