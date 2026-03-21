import React, { useState, useEffect } from 'react';
import ModalContainer from '../ui/ModalContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import TimePickerInput from '../ui/TimePickerInput';
import GreenCloseButton from '../ui/GreenCloseButton';
import { useApp } from '../contexts/AppContext';
import { useOffline } from '../contexts/OfflineContext';
import { createLocalExpenseLimit, updateLocalExpenseLimit } from '@/database/genericRepository';
import { syncExpenseLimits } from '@/services/syncService';
import { scheduleExpenseLimitNotification } from '@/services/reminderEngine';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ExpenseLimitModal({ open, onClose, activeLimit }) {
  const { theme, user } = useApp();
  const { isOnline } = useOffline();
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    amount: '',
    notification_time: '08:00',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (activeLimit) {
        setFormData({
          amount: activeLimit.amount.toString(),
          notification_time: activeLimit.notification_time || '08:00',
          is_active: activeLimit.is_active
        });
      } else {
        setFormData({ amount: '', notification_time: '08:00', is_active: true });
      }
    }
  }, [activeLimit, open]);

  const handleSave = async () => {
    const parsed = parseFloat(formData.amount);
    if (!formData.amount || parsed <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    const payload = {
      amount: parsed,
      notification_time: formData.notification_time,
      is_active: formData.is_active,
      created_by: user?.email,
    };

    try {
      // Write to SQLite first — instant, works offline and online
      let savedId = activeLimit?.id;

      if (activeLimit) {
        await updateLocalExpenseLimit(activeLimit.id, payload);
        toast.success('Expense limit updated');
      } else {
        const saved = await createLocalExpenseLimit(payload);
        savedId = saved.id;
        toast.success('Expense limit set');
      }

      // FIX: Schedule local notification immediately after SQLite write.
      // Old code had no notification scheduling at all in this modal —
      // the user set a notification_time but nothing ever fired it.
      // scheduleExpenseLimitNotification() uses @capacitor/local-notifications
      // to schedule a daily reminder at the user's chosen time.
      if (savedId && formData.is_active) {
        await scheduleExpenseLimitNotification({
          id: savedId,
          amount: parsed,
          limit_type: payload.limit_type || 'daily',
          notification_time: formData.notification_time,
          is_active: formData.is_active,
        });
      }

      // Push to Base44 in background if online — non-blocking
      if (isOnline && user?.email) {
        syncExpenseLimits(user.email).catch(e =>
          console.warn('[ExpenseLimitModal] sync failed (non-fatal):', e)
        );
      }

      // Invalidate so Transactions page re-reads from SQLite immediately
      queryClient.invalidateQueries({ queryKey: ['expenseLimits'] });
      onClose();
    } catch (error) {
      console.error('[ExpenseLimitModal] save failed:', error);
      toast.error('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer open={open} onClose={onClose} isDark={isDark} title="Expense Limit">
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <Label>Enable Expense Limit</Label>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            className="premium-switch"
          />
        </div>

        <div>
          <Label className="mb-2 block">Amount (₱)</Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
          />
        </div>

        <div>
          <Label className="mb-2 block">Notify me at</Label>
          <TimePickerInput
            value={formData.notification_time}
            onChange={(time) => setFormData({ ...formData, notification_time: time })}
            isDark={isDark}
          />
        </div>

        {!isOnline && (
          <p className="text-xs text-yellow-500 text-center">
            📵 You're offline — this will save locally and sync when reconnected.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black font-semibold hover:opacity-90"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}
