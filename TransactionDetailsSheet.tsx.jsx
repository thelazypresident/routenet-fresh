import React, { useState } from 'react';
import { Edit2, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { updateLocalTransaction, deleteLocalTransaction } from '@/database/transactionRepository';
import { syncTransactions } from '@/services/syncService';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOffline } from '../contexts/OfflineContext';

export default function TransactionDetailsSheet({
  open,
  onClose,
  transaction,
  onRefresh
}) {
  const { theme, user, formatCurrency, isReadOnly } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(
    transaction?.amount !== undefined && transaction?.amount !== null
      ? String(transaction.amount)
      : ''
  );
  const [description, setDescription] = useState(transaction?.description || '');
  const [platform, setPlatform] = useState(transaction?.platform || '');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!transaction) return null;

  const refreshViews = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categoryDetails'] });
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    onRefresh?.();
  };

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
      await updateLocalTransaction(transaction.id, {
        type: transaction.type,
        category: transaction.category,
        amount: parsedAmount,
        date: transaction.date,
        transaction_date: transaction.transaction_date || transaction.date,
        platform: transaction.type === 'income' ? platform : '',
        description: description || '',
        period: transaction.period || 'daily',
        updated_at: new Date().toISOString()
      });

      if (navigator.onLine && user?.email) {
        await syncTransactions(user.email);
      }

      await refreshViews();
      toast.success('Transaction updated');
      setIsEditing(false);
      onClose?.();
    } catch (error) {
      console.error('TransactionDetails save failed:', error);
      toast.error('Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly()) {
      toast.error('Upgrade to unlock editing');
      return;
    }

    setSaving(true);

    try {
      // FIX: Delete from SQLite first — always works offline and online.
      // The original code blocked deletion of synced transactions when offline
      // by throwing 'Connect to internet to delete a synced transaction'.
      // This violated the core rule: every delete must write to SQLite first
      // regardless of network state.
      // Pattern: SQLite delete is instant and immediate. Base44 delete is
      // attempted non-blocking in the background only if online.
      await deleteLocalTransaction(transaction.id);

      // If it has a remote_id and we are online, also delete from Base44
      // in the background — non-blocking so the UI updates immediately.
      if (transaction.remote_id && isOnline) {
        base44.entities.Transaction.delete(transaction.remote_id)
          .catch(e => console.warn('[TransactionDetails] Base44 delete failed (non-fatal):', e));
      }

      await refreshViews();
      toast.success('Transaction deleted');
      setDeleteConfirmOpen(false);
      onClose?.();
    } catch (error) {
      console.error('TransactionDetails delete failed:', error);
      toast.error(error?.message || 'Failed to delete transaction');
    } finally {
      setSaving(false);
    }
  };

  const txDate = transaction.transaction_date || transaction.date;
  const formattedDate = txDate ? format(new Date(txDate), 'MMM d, yyyy') : '-';

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          hideClose
          side="bottom"
          className={`${
            isDark
              ? 'card-dark'
              : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9] border border-gray-200'
          } h-auto max-h-[90dvh]`}
        >
          <SheetHeader
            className={`mb-4 flex flex-row items-center justify-between pb-2 space-y-0 border-b ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <SheetTitle className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transaction Details
            </SheetTitle>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    if (isReadOnly()) {
                      toast.error('Upgrade to unlock editing');
                      return;
                    }
                    setIsEditing(true);
                  }}
                  disabled={saving}
                  className={`p-1 rounded-md ${
                    isReadOnly()
                      ? 'opacity-50 cursor-not-allowed bg-gray-200 border border-gray-300'
                      : isDark
                        ? 'bg-green-900/50 border border-green-500'
                        : 'bg-green-200 border border-green-500'
                  }`}
                >
                  <Edit2
                    className={`w-4 h-4 ${
                      isReadOnly() ? 'text-gray-400' : isDark ? 'text-green-300' : 'text-green-700'
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
              )}

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    if (isReadOnly()) {
                      toast.error('Upgrade to unlock editing');
                      return;
                    }
                    setDeleteConfirmOpen(true);
                  }}
                  disabled={saving}
                  className={`p-1 rounded-md ${
                    isReadOnly()
                      ? 'opacity-50 cursor-not-allowed bg-gray-200 border border-gray-300'
                      : isDark
                        ? 'bg-red-900/50 border border-red-500'
                        : 'bg-red-200 border border-red-500'
                  }`}
                >
                  <Trash2
                    className={`w-4 h-4 ${
                      isReadOnly() ? 'text-gray-400' : isDark ? 'text-red-300' : 'text-red-700'
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-md ${
                  isDark ? 'bg-red-900/50 border border-red-500' : 'bg-red-200 border border-red-500'
                }`}
              >
                <X
                  className={`w-4 h-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            <div>
              <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                TYPE
              </p>
              <div className="flex items-center gap-2">
                {transaction.type === 'income' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                <p className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {transaction.type}
                </p>
              </div>
            </div>

            <div>
              <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                CATEGORY
              </p>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {transaction.category}
              </p>
            </div>

            <div>
              <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                DATE
              </p>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formattedDate}
              </p>
            </div>

            {isEditing ? (
              <>
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

                {transaction.type === 'income' && (
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

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setAmount(
                        transaction?.amount !== undefined && transaction?.amount !== null
                          ? String(transaction.amount)
                          : ''
                      );
                      setDescription(transaction?.description || '');
                      setPlatform(transaction?.platform || '');
                    }}
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
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    AMOUNT
                  </p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>

                {transaction.type === 'income' && (
                  <div>
                    <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                      PLATFORM
                    </p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {transaction.platform || '-'}
                    </p>
                  </div>
                )}

                <div>
                  <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    NOTES
                  </p>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {transaction.description || '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className={`max-w-sm ${isDark ? 'card-dark text-white' : 'modal-light'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>Delete this transaction?</DialogTitle>
            <DialogDescription className={isDark ? 'text-white/60' : ''}>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
