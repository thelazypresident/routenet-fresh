import { useState } from 'react';
import { purchase, restorePurchases, openManageSubscription, refreshEntitlements } from '../utils/subscriptions';

/**
 * Hook for managing subscriptions
 */
export function useSubscriptions() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async (plan) => {
    setIsPurchasing(true);
    try {
      const success = await purchase(plan);
      return success;
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      return success;
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManage = () => {
    openManageSubscription();
  };

  const handleRefresh = async () => {
    return await refreshEntitlements();
  };

  return {
    isPurchasing,
    isRestoring,
    purchase: handlePurchase,
    restore: handleRestore,
    manage: handleManage,
    refresh: handleRefresh
  };
}