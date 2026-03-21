import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import {
  getLocalTransactions,
  createLocalTransaction,
  updateLocalTransaction
} from '@/database/transactionRepository';
import { syncTransactions } from '@/services/syncService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function ManageExpenseModal({
  open,
  onClose,
  transaction = null,
  mode = 'create',
  selectedDate = null,
  defaultType = 'expense',
  defaultCategory = '',
  onRefresh
}) {
  const { theme, user, isReadOnly } = useApp();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const isEditMode = mode === 'edit' && !!transaction?.id;
  const activeType = transaction?.type || defaultType;
  const activeCategory = transaction?.category || defaultCategory;

  const [amount, setAmount] = useState(
    transaction?.amount !== undefined && transaction?.amount !== null
      ? String(transaction.amount)
      : ''
  );
  const [description, setDescription] = useState(transaction?.description || '');
  const [platform, setPlatform] = useState(transaction?.platform || '');
  const [saving, setSaving] = useState(false);

  const txDate = useMemo(() => {
    return (
      transaction?.transaction_date ||
      transaction?.date ||
      selectedDate ||
      format(new Date(), 'yyyy-MM-dd')
    );
  }, [transaction, selectedDate]);

  const refreshViews = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categoryDetails'] });
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    onRefresh?.();
  };

  const { data: existingSameDayTransactions = [] } = useQuery({
    queryKey: ['manageExpenseModal-local', activeType, activeCategory, txDate],
    queryFn: async () => {
      
      const all = await getLocalTransactions();
      return all.filter((tx) => {
        const day = tx.transaction_date || tx.date;
        return tx.type === activeType && tx.category === activeCategory && day === txDate;
      });
    },
    enabled: !!open
  });

  const handleSave = async () => {
    if (isReadOnly()) {
      toast.error('Upgrade to unlock editing');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setSaving(true);

    try {
      const now = new Date().toISOString();

      if (isEditMode) {
        await updateLocalTransaction(transaction.id, {
          type: activeType,
          category: activeCategory,
          amount: parsedAmount,
          date: txDate,
          transaction_date: txDate,
          platform: activeType === 'income' ? platform : '',
          description: description || '',
          period: 'daily',
          updated_at: now
        });
      } else {
        const localId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        await createLocalTransaction({
          id: localId,
          remote_id: null,
          type: activeType,
          category: activeCategory,
          amount: parsedAmount,
          date: txDate,
          transaction_date: txDate,
          platform: activeType === 'income' ? platform : '',
          description: description || '',
          period: 'daily',
          created_by: user?.email || '',
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
          sync_error: null
        });
      }

      if (navigator.onLine && user?.email) {
        await syncTransactions(user.email);
      }

      await refreshViews();
      toast.success(isEditMode ? 'Transaction updated' : 'Transaction added');
      onClose?.();
    } catch (error) {
      console.error('ManageExpenseModal save failed:', error);
      toast.error(isEditMode ? 'Failed to update transaction' : 'Failed to add transaction');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        hideClose
        className={`${
          isDark
            ? 'card-dark'
            : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9] border border-gray-200'
        } h-auto max-h-[90dvh]`}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">Category</Label>
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}
            >
              {activeCategory}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Type</Label>
            <div
              className={`px-3 py-2 rounded-lg text-sm capitalize ${
                isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}
            >
              {activeType}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Date</Label>
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}
            >
              {txDate}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
            />
          </div>

          {activeType === 'income' && (
            <div>
              <Label className="mb-1.5 block text-sm">Platform</Label>
              <Input
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Platform"
                className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
              />
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-sm">Notes</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
            />
          </div>

          {!isEditMode && existingSameDayTransactions.length > 0 && (
            <div
              className={`text-xs rounded-lg px-3 py-2 ${
                isDark ? 'bg-white/5 text-white/70 border border-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              Existing entries for this day/category: {existingSameDayTransactions.length}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary"
            >
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}