import React, { useState } from 'react';
import { Crown, Check, X, Sparkles, Shield, TrendingUp, Bell, FileText, Zap, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '../contexts/AppContext';
import { useSubscriptions } from '../hooks/useSubscriptions';

export default function PremiumPaywallSheet({ open, onClose, context }) {
  const { theme, user, isTrialActive } = useApp();
  const { isPurchasing, isRestoring, purchase, restore, manage } = useSubscriptions();
  const isDark = theme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const trialActive = isTrialActive();

  const features = [
    { icon: TrendingUp, title: 'Smart income & expense insights', desc: 'AI-powered tracking and predictions' },
    { icon: Sparkles, title: 'Unlimited savings goals', desc: 'Auto-save with predictions' },
    { icon: Bell, title: 'Renewal & maintenance alerts', desc: 'Never miss important deadlines' },
    { icon: Shield, title: 'Advanced notifications', desc: 'Expense limits and reminders' },
    { icon: FileText, title: 'Clean export reports', desc: 'PDF and CSV for your records' },
    { icon: Zap, title: 'Priority features access', desc: 'Get new features first' }
  ];

  const handleStartSubscription = async () => {
    const success = await purchase(selectedPlan);
    if (success) {
      onClose();
    }
  };

  const handleRestore = async () => {
    const success = await restore();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-lg h-screen sm:h-[95vh] w-full sm:max-w-md overflow-y-auto p-0 ${
          isDark 
            ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]' 
            : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
        } [&>button]:hidden`}
      >
        {/* HEADER */}
        <div className={`px-6 pt-6 pb-4 ${isDark ? 'bg-gradient-to-b from-[#0a1a0a]/60 to-transparent' : 'bg-gradient-to-b from-white/40 to-transparent'}`}>
          <button 
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all ${
              isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
          
          <div className="text-center mt-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/30">
              <Crown className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Go Premium
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {context ? `Unlock: ${context}` : 'Unlock all features'}
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-6 pb-6 space-y-6">
          {/* Features Grid */}
          <div className="space-y-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/20' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                >
                  <div className={`flex-shrink-0 p-2 rounded-xl ${
                    isDark ? 'bg-[#66BB6A]/20' : 'bg-[#66BB6A]/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-[#0B3D2E]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {feature.desc}
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                </div>
              );
            })}
          </div>

          {/* Pricing Cards */}
          <div className="space-y-3">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Choose your plan
            </h3>
            
            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-5 rounded-2xl border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? isDark
                    ? 'border-[#66BB6A] bg-gradient-to-r from-[#0a2515]/60 to-[#0a1a0a]/60 shadow-[0_0_30px_rgba(102,187,106,0.5)]'
                    : 'border-[#66BB6A] bg-[#66BB6A]/5 shadow-[0_0_30px_rgba(102,187,106,0.3)]'
                  : isDark
                  ? 'border-[#66BB6A]/20 bg-[#0a1a0a]/40'
                  : 'border-gray-200 bg-white/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Monthly
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    Flexible billing
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₱49
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    per month
                  </p>
                </div>
              </div>
            </button>

            {/* Annual Plan */}
            <button
              onClick={() => setSelectedPlan('annual')}
              className={`w-full p-5 rounded-2xl border-2 transition-all relative ${
                selectedPlan === 'annual'
                  ? isDark
                    ? 'border-[#66BB6A] bg-gradient-to-r from-[#0a2515]/60 to-[#0a1a0a]/60 shadow-[0_0_30px_rgba(102,187,106,0.5)]'
                    : 'border-[#66BB6A] bg-[#66BB6A]/5 shadow-[0_0_30px_rgba(102,187,106,0.3)]'
                  : isDark
                  ? 'border-[#66BB6A]/20 bg-[#0a1a0a]/40'
                  : 'border-gray-200 bg-white/40'
              }`}
            >
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold shadow-lg">
                Best Value • Save ₱189
              </div>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Yearly
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    Best value
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₱399
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    per year
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`border-t px-6 py-5 space-y-3 ${
          isDark 
            ? 'border-[#66BB6A]/20 bg-gradient-to-t from-[#0a1a0a]/80 to-transparent backdrop-blur-xl' 
            : 'border-gray-200 bg-gradient-to-t from-white/40 to-transparent'
        }`}>
          <Button
            onClick={handleStartSubscription}
            disabled={isPurchasing || isRestoring}
            className="w-full bg-gradient-to-r from-[#0B3D2E] via-[#66BB6A] to-[#A5D6A7] hover:opacity-90 text-white font-bold py-4 text-base rounded-2xl shadow-2xl shadow-[#66BB6A]/30 disabled:opacity-50"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : trialActive ? 'Continue with Trial' : 'Start Subscription'}
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-xs">
            <button 
              onClick={manage}
              disabled={isPurchasing || isRestoring}
              className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors underline disabled:opacity-50`}
            >
              Manage Subscription
            </button>
            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>•</span>
            <button 
              onClick={manage}
              disabled={isPurchasing || isRestoring}
              className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors underline disabled:opacity-50`}
            >
              Cancel anytime
            </button>
            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>•</span>
            <button 
              onClick={handleRestore}
              disabled={isPurchasing || isRestoring}
              className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors underline disabled:opacity-50`}
            >
              {isRestoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>

          <p className={`text-[10px] text-center leading-relaxed ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            Payment via Apple or Google. Auto-renews unless canceled.
            <br />
            <span className="underline cursor-pointer hover:opacity-70">Terms</span>
            {' • '}
            <span className="underline cursor-pointer hover:opacity-70">Privacy</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}