import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { useOffline } from '../contexts/OfflineContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  getLocalTransactions,
  createLocalTransaction,
  updateLocalTransaction,
} from '@/database/transactionRepository';
import { safeGetDb } from '@/database/db';
import { syncTransactions } from '@/services/syncService';

export default function CategoryDetailsSheet({
  open,
  onClose,
  type,
  categoryKey,
  categoryLabel,
  startDate,
  endDate,
  selectedDate,
  activePeriod,
  onRefresh,
  isExpensePremium
}) {
  const { theme, user, formatCurrency, isReadOnly } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      fuel: '⛽',
      food: '🍔🥤',
      load: '📱',
      topup: '🔋',
      maintenance: '🛠',
      tip: '💸',
      gross_income: '💰',
      extra_income: '💰',
      parking: '🅿️',
      parking_ticket: '🎫',
      toll: '🛣️',
      gate_pass: '🎟️',
      wash_cleaning: '🧽',
      penalty_violation: '🚨',
      permit: '📄',
      drivers_license_renewal: '🪪',
      vehicle_registration: '🚘',
      vehicle_insurance: '🛡️',
      helper: '🤝',
      other: '🧾'
    };
    return emojiMap[category] || '';
  };

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showNewRow, setShowNewRow] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  const dateLabel = useMemo(() => {
    if (activePeriod === 'daily' && selectedDate) {
      return format(new Date(selectedDate), 'MMM d, yyyy');
    }
    return `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')}`;
  }, [activePeriod, selectedDate, startDate, endDate]);

  const getTxDay = (tx) => {
    const d = tx?.transaction_date || tx?.date;
    if (typeof d === 'string' && d.length >= 10) return d.slice(0, 10);
    const ts = tx?.created_at || tx?.createdAt;
    return ts ? format(new Date(ts), 'yyyy-MM-dd') : null;
  };

  const { data: transactions = [], refetch: refetchDetails } = useQuery({
    queryKey: [
      'categoryDetails',
      categoryKey,
      type,
      format(new Date(startDate), 'yyyy-MM-dd'),
      format(new Date(endDate), 'yyyy-MM-dd')
    ],
    queryFn: async () => {
      

      const startKey = format(new Date(startDate), 'yyyy-MM-dd');
      const endKeyExclusive = format(new Date(endDate), 'yyyy-MM-dd');
      const inRange = (dayKey) => dayKey && dayKey >= startKey && dayKey < endKeyExclusive;

      // ✅ FIX: Read from Base44 directly — same source as Dashboard.
      // Old code read from SQLite while Dashboard read from Base44,
      // so saves appeared in the sheet but never showed in Dashboard totals.
      const allTx = await getLocalTransactions();

      return allTx
        .filter((t) => t.category === categoryKey && t.type === type && inRange(getTxDay(t)))
        .sort((a, b) => {
          const aDay = getTxDay(a) || '';
          const bDay = getTxDay(b) || '';
          if (bDay !== aDay) return bDay.localeCompare(aDay);
          return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
        });
    },
    enabled: !!open,
    // ✅ FIX: staleTime 0 forces fresh fetch every time sheet opens
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // ✅ With SQLite as source of truth, no Base44 indexing delay needed.
  // Invalidate queries immediately — SQLite already has the new record.
  const triggerRefresh = () => {
    refetchDetails();
    queryClient.invalidateQueries({ queryKey: ['categoryDetails'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    onRefresh?.();
  };

  const saveMutation = useMutation({
    mutationFn: async ({ txId, amount, note, isNew, txDate }) => {
      const parsedAmount = parseFloat(amount);
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        throw new Error('Invalid amount');
      }

      const now = new Date().toISOString();

      if (isNew) {
        // ✅ FIX: Write to SQLite first — instant, works offline and online
        const localId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await createLocalTransaction({
          id: localId,
          remote_id: null,
          type,
          category: categoryKey,
          amount: parsedAmount,
          date: txDate,
          transaction_date: txDate,
          description: note || '',
          platform: '',
          period: 'daily',
          created_by: user?.email || '',
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
          sync_error: null,
        });
      } else {
        await updateLocalTransaction(txId, {
          type,
          category: categoryKey,
          amount: parsedAmount,
          date: txDate,
          transaction_date: txDate,
          description: note || '',
          platform: '',
          period: 'daily',
          updated_at: now,
          sync_status: 'pending',
          sync_error: null,
        });
      }

      // Push to Base44 in background if online — never blocks the save
      if (isOnline && user?.email) {
        syncTransactions(user?.email).catch(e => console.warn('[CategoryDetailsSheet] sync:', e));
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setEditAmount('');
      setEditNote('');
      setShowNewRow(false);
      setNewAmount('');
      setNewNote('');
      toast.success('Saved');
      // ✅ SQLite is already updated — refresh immediately, no delay needed
      triggerRefresh();
    },
    onError: (error) => {
      console.error('CategoryDetails save failed:', error);
      toast.error('Failed to save');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (tx) => {
      const db = await safeGetDb();
      if (!db) throw new Error('Database not available');

      // ✅ FIX: Delete from SQLite immediately (works offline)
      await db.run(`DELETE FROM transactions WHERE id = ?`, [tx.id]);

      // If it has a remote_id, also delete from Base44 when online
      if (tx.remote_id && isOnline) {
        try {
          const { base44 } = await import('@/api/base44Client');
          await base44.entities.Transaction.delete(tx.remote_id);
        } catch (e) {
          console.warn('[CategoryDetailsSheet] Base44 delete failed (non-fatal):', e);
        }
      }
    },
    onSuccess: () => {
      toast.success('Deleted');
      triggerRefresh();
    },
    onError: (error) => {
      console.error('CategoryDetails delete failed:', error);
      toast.error(error?.message || "Couldn't delete");
    }
  });

  const handleEditAmount = (tx) => {
    if (isReadOnly()) {
      toast.error('Upgrade to unlock editing');
      return;
    }

    setEditingId(tx.id);
    setEditAmount(tx.amount?.toString() || '');
    setEditNote(tx.description || '');
  };

  const handleSaveEdit = () => {
    if (!editAmount || Number.isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    const existingTx = transactions.find((tx) => tx.id === editingId);
    const txDate =
      existingTx?.transaction_date ||
      existingTx?.date ||
      format(new Date(selectedDate), 'yyyy-MM-dd');

    saveMutation.mutate({
      txId: editingId,
      amount: editAmount,
      note: editNote,
      txDate
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditNote('');
  };

  const handleAddNew = () => {
    if (isReadOnly()) {
      toast.error('Upgrade to unlock editing');
      return;
    }

    setShowNewRow(true);
    setNewAmount('');
    setNewNote('');
  };

  const handleSaveNew = () => {
    if (!newAmount || Number.isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    const txDate = format(new Date(selectedDate), 'yyyy-MM-dd');

    saveMutation.mutate({
      amount: newAmount,
      note: newNote,
      isNew: true,
      txDate
    });
  };

  const handleCancelNew = () => {
    setShowNewRow(false);
    setNewAmount('');
    setNewNote('');
  };

  const handleDeleteTx = (tx) => {
    if (isReadOnly()) {
      toast.error('Upgrade to unlock editing');
      return;
    }

    setTxToDelete(tx);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (txToDelete?.id) {
      deleteMutation.mutate(txToDelete);
      setDeleteConfirmOpen(false);
      setTxToDelete(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          hideClose={true}
          side="bottom"
          className={`${
            isDark
              ? 'card-dark'
              : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9] border border-gray-200'
          } h-[calc(100dvh-68px)] max-h-[calc(100dvh-68px)] flex flex-col !inset-x-0 !top-[68px] !bottom-0 !mt-0`}
        >
          <SheetHeader
            className={`mb-2 flex flex-row items-center justify-between pb-2 space-y-0 border-b ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <SheetTitle className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Details
            </SheetTitle>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isReadOnly()}
                className={`p-1 rounded-md ${
                  isReadOnly()
                    ? 'opacity-50 cursor-not-allowed bg-gray-200 border border-gray-300'
                    : isDark
                      ? 'bg-green-900/50 border border-green-500'
                      : 'bg-green-200 border border-green-500'
                }`}
              >
                <Plus
                  className={`w-4 h-4 ${
                    isReadOnly() ? 'text-gray-400' : isDark ? 'text-green-300' : 'text-green-700'
                  }`}
                  strokeWidth={2.5}
                />
              </button>

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

          <div className="mb-1 mt-0 pt-0">
            <div className="space-y-0">
              <div>
                <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  CATEGORY
                </p>
                <div className="flex items-center gap-2">
                  {getCategoryEmoji(categoryKey) && <span className="text-sm">{getCategoryEmoji(categoryKey)}</span>}
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {categoryLabel}
                  </p>
                </div>
              </div>

              <div>
                <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  TYPE
                </p>
                <div className="flex items-center gap-2">
                  {type === 'income' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <p className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {type}
                  </p>
                </div>
              </div>

              <div>
                <p className={`text-[11px] font-semibold tracking-wide ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  DATE
                </p>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {dateLabel}
                </p>
              </div>
            </div>

            <div className={`mt-1 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-4 mt-0">
            {showNewRow && (
              <div className={`p-3 space-y-2 ${isDark ? 'bg-white/5 border border-white/10' : ''}`}>
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Amount
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      isDark
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
                    } outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Note
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter a note…"
                    className={`w-full px-3 py-2 rounded-lg text-sm ${
                      isDark
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
                    } outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={handleCancelNew} variant="outline" className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNew} className="flex-1 btn-primary" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {transactions.length === 0 && !showNewRow && !editingId ? (
              <div className={`text-center py-6 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                <p className="text-sm">No transactions yet. Tap + to add one.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <div
                    className={`py-1 flex items-center justify-between border-b ${
                      isDark ? 'border-white/10' : 'border-black/10'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.platform || tx.description ? (
                        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          {tx.platform && <span>{tx.platform}</span>}
                          {tx.platform && tx.description && <span> • </span>}
                          {tx.description && <span>{tx.description}</span>}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAmount(tx);
                        }}
                        disabled={isReadOnly()}
                        className={`p-2 rounded-lg transition-colors ${
                          isReadOnly()
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                              ? 'hover:bg-white/10 text-[#66BB6A]'
                              : 'hover:bg-black/5'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTx(tx);
                        }}
                        disabled={isReadOnly()}
                        className={`p-2 rounded-lg transition-colors ${
                          isReadOnly()
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark
                              ? 'hover:bg-white/10 text-red-500'
                              : 'hover:bg-black/5'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {editingId === tx.id && (
                    <div className={`p-3 space-y-2 mt-1 ${isDark ? 'bg-white/5 border border-white/10' : ''}`}>
                      <div>
                        <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Amount
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-3 py-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                              : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
                          } outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>

                      <div>
                        <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Note
                        </label>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Enter a note…"
                          className={`w-full px-3 py-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                              : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
                          } outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button onClick={handleCancelEdit} variant="outline" className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} className="flex-1 btn-primary" disabled={saveMutation.isPending}>
                          {saveMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
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
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}