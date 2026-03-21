import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

const ONBOARDING_VERSION = 2;

export default function Onboarding() {
  const { theme } = useApp();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleContinue = () => {
    if (currentScreen < 2) {
      setCurrentScreen(currentScreen + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await base44.auth.updateMe({ onboarding_version: ONBOARDING_VERSION });
      navigate(createPageUrl('Dashboard'), { replace: true });
    } catch (error) {
      console.error('Failed to complete onboarding', error);
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  };

  const screens = [
    {
      title: 'Track Your Income, Expenses & Real Profit',
      subtitle: 'RouteNet gives you a clear daily view of what you earn, what you spend, and what you keep.',
      bullets: [
        'Log daily income and expenses in seconds',
        'See net profit automatically calculated',
        'Designed for everyday use'
      ],
      ctaText: 'Continue',
      icon: '💰'
    },
    {
      title: 'Designed for Hustling Riders & Drivers',
      subtitle: 'Built for everyday earners who track fuel, food, load, and maintenance in real time.',
      bullets: [
        'Simple summaries without complex charts',
        'Reminders for renewals and maintenance',
        'Smart insights to help you improve daily profit'
      ],
      ctaText: 'Continue',
      icon: '🏍️'
    },
    {
      title: 'Enjoy Full Access Free for 30 Days',
      subtitle: 'After the trial, a subscription is required to continue tracking your earnings, expenses, savings goals, renewals, maintenance, and insights.',
      bullets: [
        'Full access during your 30-day trial',
        'No payment required today',
        'Cancel anytime before trial ends'
      ],
      ctaText: 'Get Started',
      icon: '🎉'
    }
  ];

  const screen = screens[currentScreen];

  return (
    <div
      className="h-[100dvh] flex flex-col px-6 pt-8 pb-6"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #0a1f14 0%, #05120c 50%, #000000 100%)'
          : 'linear-gradient(180deg, #f0f9f4 0%, #ffffff 100%)'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col text-center"
        >
          <div className="flex items-center justify-center" style={{ height: '35%' }}>
            {currentScreen === 1 ? (
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a]'
                    : 'bg-white'
                }`}
                style={{
                  boxShadow: isDark
                    ? '0 10px 30px rgba(34,197,94,0.35)'
                    : '0 10px 30px rgba(34,197,94,0.25)'
                }}
              >
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691eb67221759ebcd9ac9b90/a10b55a24_LOGO.jpeg"
                  alt="RouteNet Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
            ) : (
              <div className="text-[120px] leading-none">{screen.icon}</div>
            )}
          </div>

          <h1 className={`text-2xl font-bold mb-3 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {screen.title}
          </h1>

          <p className={`text-sm leading-relaxed mb-6 px-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {screen.subtitle}
          </p>

          <div className="space-y-3 mb-4 px-4">
            {screen.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-2.5 text-left">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className={`text-sm ${isDark ? 'text-white/85' : 'text-gray-800'}`}>
                  {bullet}
                </p>
              </div>
            ))}
          </div>

          <div className="flex-grow" />

          <div className="flex justify-center gap-2 mb-6">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentScreen
                    ? 'w-8 bg-gradient-to-r from-green-500 to-green-400'
                    : `w-2 ${isDark ? 'bg-white/20' : 'bg-gray-300'}`
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleContinue}
            className="w-full h-12 rounded-xl bg-white text-[#0F3D2E] font-semibold text-base mb-3 hover:opacity-90 transition-opacity"
          >
            {screen.ctaText}
          </button>

          <button
            onClick={handleSkip}
            className={`w-full text-xs py-2 ${isDark ? 'text-white/70' : 'text-gray-500'} hover:opacity-70 transition-opacity`}
          >
            Skip for now
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}