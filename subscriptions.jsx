import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

// Product IDs (must match App Store Connect & Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: 'biyahero_premium_monthly',
  ANNUAL: 'biyahero_premium_annual'
};

// Platform detection
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);
const isMobile = () => isIOS() || isAndroid();

/**
 * Check if Capacitor IAP is available
 */
const hasIAPPlugin = () => {
  return typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins?.InAppPurchase;
};

/**
 * Purchase a subscription plan
 * @param {string} plan - 'monthly' or 'annual'
 * @returns {Promise<boolean>} - true if successful
 */
export async function purchase(plan) {
  const productId = plan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;

  // Check if running on native device with IAP plugin
  if (hasIAPPlugin()) {
    try {
      const InAppPurchase = window.Capacitor.Plugins.InAppPurchase;
      
      // Trigger purchase flow
      const result = await InAppPurchase.purchase({ productId });
      
      if (result.success) {
        // Update backend with purchase
        await updateSubscriptionStatus('pro', 'active', result.receipt);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Purchase error:', error);
      
      if (error.code === 'USER_CANCELLED') {
        toast.info('Purchase cancelled');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
      
      return false;
    }
  }

  // Fallback for web/development
  if (!isMobile()) {
    toast.info('Subscriptions are available in the mobile app', {
      description: 'Download the iOS or Android app to subscribe'
    });
    return false;
  }

  // Mobile but no plugin - show install prompt
  toast.error('In-app purchases not available', {
    description: 'Please update the app or contact support'
  });
  return false;
}

/**
 * Restore previous purchases (iOS requirement)
 * @returns {Promise<boolean>}
 */
export async function restorePurchases() {
  if (hasIAPPlugin()) {
    try {
      const InAppPurchase = window.Capacitor.Plugins.InAppPurchase;
      const result = await InAppPurchase.restorePurchases();
      
      if (result.purchases && result.purchases.length > 0) {
        // Find active subscription
        const activeSub = result.purchases.find(p => 
          p.productId === PRODUCT_IDS.MONTHLY || p.productId === PRODUCT_IDS.ANNUAL
        );
        
        if (activeSub) {
          await updateSubscriptionStatus('pro', 'active', activeSub.receipt);
          toast.success('Premium subscription restored!');
          return true;
        }
      }
      
      toast.info('No previous purchases found');
      return false;
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore purchases');
      return false;
    }
  }

  toast.info('Restore is available in the mobile app');
  return false;
}

/**
 * Open native subscription management
 */
export function openManageSubscription() {
  if (isIOS()) {
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
  } else if (isAndroid()) {
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  } else {
    toast.info('Manage subscriptions in the mobile app');
  }
}

/**
 * Update backend subscription status
 */
async function updateSubscriptionStatus(tier, status, receipt) {
  try {
    const updateData = {
      subscription_tier: tier,
      subscription_status: status,
      subscription_updated_at: new Date().toISOString()
    };
    
    // Add receipt data if available
    if (receipt) {
      updateData.subscription_receipt = receipt;
    }
    
    // Calculate expiry (30 days for monthly, 365 for annual)
    const expiryDate = new Date();
    const isAnnual = receipt?.productId === PRODUCT_IDS.ANNUAL;
    expiryDate.setDate(expiryDate.getDate() + (isAnnual ? 365 : 30));
    updateData.premium_until = expiryDate.toISOString().split('T')[0];
    
    await base44.auth.updateMe(updateData);
    
    // Refresh user data in app context
    window.location.reload();
  } catch (error) {
    console.error('Failed to update subscription status:', error);
  }
}

/**
 * Refresh entitlements from store
 */
export async function refreshEntitlements() {
  if (hasIAPPlugin()) {
    try {
      const InAppPurchase = window.Capacitor.Plugins.InAppPurchase;
      const result = await InAppPurchase.getEntitlements();
      
      if (result.entitlements && result.entitlements.length > 0) {
        await updateSubscriptionStatus('pro', 'active');
        return true;
      }
    } catch (error) {
      console.error('Refresh entitlements error:', error);
    }
  }
  
  return false;
}