import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * Hook to manage premium feature gating with new PremiumPaywallSheet
 */
export function usePremiumGate() {
  const { isPremium, isTrialActive } = useApp();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallContext, setPaywallContext] = useState('');

  const checkPremiumAccess = (context = '') => {
    const premium = isPremium();
    const trialActive = isTrialActive();

    if (premium || trialActive) {
      return true;
    }

    setPaywallContext(context);
    setPaywallOpen(true);
    return false;
  };

  const openPremiumPaywall = (context = '') => {
    setPaywallContext(context);
    setPaywallOpen(true);
  };

  const closePaywall = () => {
    setPaywallOpen(false);
    setPaywallContext('');
  };

  return {
    checkPremiumAccess,
    openPremiumPaywall,
    closePaywall,
    paywallOpen,
    paywallContext,
    isPremium: isPremium(),
    isTrialActive: isTrialActive()
  };
}