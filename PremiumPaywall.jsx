import React, { useState } from 'react';
import { Crown, Check, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

export default function PremiumPaywall({ open, onClose, context }) {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const benefits = [
    'Smart income & expense insights',
    'Unlimited savings goals',
    'Auto-save & predictions',
    'Renewal & maintenance alerts',
    'Advanced notifications (limits, reminders)',
    'Clean export reports (PDF / CSV)',
    'Priority features access'
  ];

  const handleStartSubscription = () => {
    // Trigger native App Store / Google Play purchase
    toast.info('Opening App Store / Google Play subscription...');
    // In production: StoreKit (iOS) or Google Play Billing (Android)
  };

  const handleManageSubscription = () => {
    // Detect platform and open appropriate subscription management
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isIOS) {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    } else {
      // Desktop fallback
      toast.info('Please manage your subscription through the App Store or Google Play');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-md h-[90vh] flex flex-col p-0 ${
          isDark 
            ? 'bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a] border border-[#388E3C]/30 text-white' 
            : 'bg-white'
        } [&>button]:hidden`}
      >
        {/* Header - Fixed */}
        <div className={`flex-shrink-0 px-6 pt-6 pb-4 ${isDark ? 'bg-gradient-to-b from-[#0a0a0a] to-transparent' : 'bg-white'}`}>
          <button 
            onClick={onClose}
            className={`mb-4 p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Go Premium
            </h1>
            {context && (
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                Unlock: {context}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6">
          {/* Benefits */}
          <div>
            <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              What you unlock
            </h3>
            <div className={`space-y-3 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Selector */}
          <div>
            <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Choose your plan
            </h3>
            <div className="space-y-3">
              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === 'monthly'
                    ? isDark
                      ? 'border-[#66BB6A] bg-[#66BB6A]/10 shadow-[0_0_20px_rgba(102,187,106,0.3)]'
                      : 'border-[#66BB6A] bg-[#E8F5E9] shadow-[0_0_20px_rgba(102,187,106,0.2)]'
                    : isDark
                    ? 'border-white/10 bg-white/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Monthly
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      Flexible billing
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                className={`w-full p-4 rounded-xl border-2 transition-all relative ${
                  selectedPlan === 'annual'
                    ? isDark
                      ? 'border-[#66BB6A] bg-[#66BB6A]/10 shadow-[0_0_20px_rgba(102,187,106,0.3)]'
                      : 'border-[#66BB6A] bg-[#E8F5E9] shadow-[0_0_20px_rgba(102,187,106,0.2)]'
                    : isDark
                    ? 'border-white/10 bg-white/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white shadow-sm">
                  Best Value
                </span>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Yearly
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      Save ₱189/year
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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

        </div>

        {/* Fixed Footer with CTA */}
        <div className={`flex-shrink-0 border-t ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'} px-6 py-4 space-y-3`}>
          <Button
            onClick={handleStartSubscription}
            className="w-full bg-gradient-to-r from-[#0B3D2E] via-[#66BB6A] to-[#A5D6A7] hover:opacity-90 text-white font-bold py-4 text-base shadow-lg"
          >
            Start Subscription
          </Button>
          
          <button 
            onClick={handleManageSubscription}
            className={`text-xs text-center w-full ${isDark ? 'text-white/60 hover:text-white/80' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            Cancel anytime
          </button>

          <p className={`text-[11px] text-center leading-relaxed ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            By continuing, you agree to Terms & Privacy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}