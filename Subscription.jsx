import React, { useState } from 'react';
import { ArrowLeft, Crown, Check, Sparkles, Shield, TrendingUp, Bell, FileText, Zap, Loader2 } from 'lucide-react';
import { useApp } from '../components/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import StatusPill from '../components/ui/StatusPill';
import { useSubscriptions } from '../components/hooks/useSubscriptions';

export default function Subscription() {
  const { t, theme, user, isPremium, isTrialActive } = useApp();
  const { isPurchasing, isRestoring, purchase, restore, manage } = useSubscriptions();
  const isDark = theme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  
  const trialActive = isTrialActive();
  const premium = isPremium();

  const handleStartSubscription = async () => {
    await purchase(selectedPlan);
  };

  const handleRestore = async () => {
    await restore();
  };

  const features = [
    { icon: TrendingUp, title: 'Advanced Insights' },
    { icon: Sparkles, title: 'Unlimited Tracking' },
    { icon: Bell, title: 'Vehicle Reminders' },
    { icon: Shield, title: 'Savings Goals' },
    { icon: FileText, title: 'Export Reports' },
    { icon: Zap, title: 'Future Tools' }
  ];
  
  return (
    <div className={`min-h-screen pb-24 ${
      isDark 
        ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]' 
        : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
    }`}>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/30">
            <Crown className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Unlock RouteNet Premium
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Take full control of your earnings, expenses, and savings.
            </p>
          </div>
          
          {/* Current Status */}
          <div className="flex justify-center">
            <StatusPill 
              status={user?.subscription_tier === 'pro' ? 'premium' : trialActive ? 'trial' : 'free'}
              trialDaysLeft={trialActive && user?.trial_start_date ? Math.max(0, 30 - Math.floor((new Date() - new Date(user.trial_start_date)) / (1000 * 60 * 60 * 24))) : null}
            />
          </div>
        </div>

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
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                </div>
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              </div>
            );
          })}
        </div>

        {/* Plan Selector */}
         <div className="space-y-3">
           <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
             Choose your plan
           </h3>

           {/* Free Plan */}
           <div className={`w-full p-5 rounded-2xl border-2 transition-all opacity-60 ${
             isDark
               ? 'border-gray-700 bg-[#0a1a0a]/30'
               : 'border-gray-200 bg-gray-50/40'
           }`}>
             <div className="flex items-center justify-between">
               <div className="text-left">
                 <div className="flex items-center gap-2">
                   <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                     Free Trial
                   </p>
                   <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                     isDark ? 'bg-gray-700/50 text-white/70' : 'bg-gray-200 text-gray-600'
                   }`}>
                     Current Plan
                   </span>
                 </div>
                 <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                   Access all features for 30 days free.
                 </p>
               </div>
               <div className="text-right">
                 <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                   ₱0
                 </p>
                 <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                   trial period
                 </p>
               </div>
             </div>
           </div>

           {/* Monthly Plan */}
<button
  onClick={() => setSelectedPlan('monthly')}
  className={`w-full p-5 rounded-2xl border-2 transition-all relative ${
    selectedPlan === 'monthly'
      ? isDark
        ? 'border-[#66BB6A] bg-gradient-to-r from-[#0a2515]/60 to-[#0a1a0a]/60 shadow-[0_0_30px_rgba(102,187,106,0.5)]'
        : 'border-[#66BB6A] bg-[#66BB6A]/5 shadow-[0_0_30px_rgba(102,187,106,0.3)]'
      : isDark
      ? 'border-[#66BB6A]/20 bg-[#0a1a0a]/40'
      : 'border-gray-200 bg-white/40'
  }`}
>
  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold shadow-lg">
    Most Popular
  </div>

  <div className="flex items-center justify-between">
    <div className="text-left">
      <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Monthly Premium
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
        Flexible billing
      </p>
    </div>
    <div className="text-right">
      <p className={`text-base font-medium line-through mb-1 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
  ₱98
</p>
      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
        Yearly Premium
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
        Best value
      </p>
    </div>
    <div className="text-right">
      <p className={`text-base font-medium line-through mb-1 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
  ₱798
</p>
      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ₱399
      </p>
      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
        per year
      </p>
    </div>
  </div>
</button>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {!premium && (
            <Button
              onClick={handleStartSubscription}
              disabled={isPurchasing || isRestoring}
              className="w-full bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] hover:opacity-90 text-black font-bold py-4 text-base rounded-full shadow-2xl shadow-[#66BB6A]/30 disabled:opacity-50"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : trialActive ? 'Continue with Trial' : 'Start Subscription'}
            </Button>
          )}

          <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
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
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </button>
          </div>
        </div>

        {/* App Store Compliance */}
         <div className={`text-[10px] text-center leading-relaxed ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
           <p>Payment via Apple or Google. Auto-renews unless canceled.</p>
         </div>
        </div>
        </div>
        );
        }