import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Banknote, Lock } from 'lucide-react';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getLocalTransactions, deleteLocalTransaction } from '@/database/transactionRepository';
import { getLocalExpenseLimits } from '@/database/genericRepository';
import { syncTransactions, syncExpenseLimits } from '@/services/syncService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AddTransactionModal from '../components/transactions/AddTransactionModal';
import ExpenseLimitModal from '../components/transactions/ExpenseLimitModal';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import DateRangeModal from '../components/DateRangeModal';
import ReadOnlyBanner from '../components/ReadOnlyBanner';
import { getNormalizedDateRange, filterTransactionsByDateRange } from '../components/utils/dateRangeHelpers';
import { useLiveToday, isSameDay } from '../components/utils/todayHelpers';
import { parseLocalDateOnly } from '../components/utils/dateOnly';


export default function Transactions() {
  const navigate = useNavigate();
  const { t, theme, user, formatCurrency, formatDate, isPremium, isReadOnly } = useApp();
  const { isOnline } = useOffline();
  const [activeTab, setActiveTab] = useState('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseLimitModalOpen, setExpenseLimitModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [activePeriod, setActivePeriod] = useState('daily');
  const liveToday = useLiveToday(true);
  const [selectedDate, setSelectedDate] = useState(liveToday);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarStart, setCalendarStart] = useState(liveToday);
  const [calendarEnd, setCalendarEnd] = useState(liveToday);

  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activePeriod !== 'calendar') {
      setSelectedDate(prev => (prev && isSameDay(prev, liveToday)) ? prev : liveToday);
      setCalendarStart(prev => (prev && isSameDay(prev, liveToday)) ? prev : liveToday);
      setCalendarEnd(prev => (prev && isSameDay(prev, liveToday)) ? prev : liveToday);
    }
  }, [liveToday, activePeriod]);

  const { startDate, endDate, uiLabel } = useMemo(
    () => getNormalizedDateRange(activePeriod, selectedDate, calendarStart, calendarEnd),
    [activePeriod, selectedDate, calendarStart, calendarEnd]
  );

  const { data: allTransactions = [], refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      
      if (isOnline) {
        syncTransactions(user?.email).catch(e => console.warn('[Transactions] tx sync:', e));
      }
      return getLocalTransactions();
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: expenseLimits = [], refetch: refetchLimits } = useQuery({
    queryKey: ['expenseLimits'],
    queryFn: async () => {
      
      if (isOnline) {
        syncExpenseLimits(user?.email).catch(e => console.warn('[Transactions] limit sync:', e));
      }
      return getLocalExpenseLimits();
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const activeExpenseLimit = expenseLimits.find(l => l.is_active);
  const hasPremiumAccess = isPremium();
  const isSpendingLimitLocked = !hasPremiumAccess && expenseLimits.length >= 2;

  const dateFilteredTransactions = filterTransactionsByDateRange(allTransactions, startDate, endDate);

  const deleteMutation = useMutation({
    mutationFn: async (transaction) => {
      // FIX: Delete from SQLite first — works instantly offline and online.
      // Old code called base44.entities.Transaction.delete() directly which
      // fails offline and leaves the record visible in the list until reconnect.
      await deleteLocalTransaction(transaction.id);

      // If it has a remote_id and we are online, also delete from Base44
      // in the background — non-blocking so the UI updates immediately.
      if (transaction.remote_id && isOnline) {
        base44.entities.Transaction.delete(transaction.remote_id)
          .catch(e => console.warn('[Transactions] Base44 delete failed (non-fatal):', e));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refetch();
      toast.success(t('TRANSACTION_DELETED'));
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error) => {
      console.error('[Transactions] delete failed:', error);
      toast.error(t('PROFILE_UPDATE_FAILED'));
    }
  });

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (isReadOnly()) {
      toast.error(t('UPGRADE_TO_EDIT'));
      setDeleteDialogOpen(false);
      return;
    }
    if (transactionToDelete) {
      // FIX: Pass the full transaction object so deleteMutation has remote_id
      deleteMutation.mutate(transactionToDelete);
    }
  };

  const expenseCategoryLabels = {
    fuel: t('FUEL'),
    food: t('FOOD'),
    load: t('LOAD'),
    topup: t('TOPUP'),
    maintenance: t('MAINTENANCE'),
    parking: t('PARKING'),
    parking_ticket: t('PARKING_TICKET'),
    toll: t('TOLL'),
    gate_pass: t('GATE_PASS'),
    wash_cleaning: t('WASH_CLEANING'),
    penalty_violation: t('PENALTY_VIOLATION'),
    permit: t('PERMIT'),
    drivers_license_renewal: t('DRIVERS_LICENSE_RENEWAL'),
    vehicle_registration: t('VEHICLE_REGISTRATION'),
    vehicle_insurance: t('VEHICLE_INSURANCE'),
    other: t('OTHER')
  };

  const incomeCategoryLabels = {
    gross_income: t('DRIVER_EARNINGS'),
    tip: t('TIP'),
    other: t('OTHER')
  };

  const expenseCategoryOrder = ['fuel', 'food', 'load', 'topup', 'maintenance', 'parking', 'parking_ticket', 'toll', 'gate_pass', 'wash_cleaning', 'penalty_violation', 'permit', 'drivers_license_renewal', 'vehicle_registration', 'vehicle_insurance', 'other'];
  const incomeCategoryOrder = ['gross_income', 'tip', 'other'];

  const filteredTransactions = activeTab === 'expense'
    ? dateFilteredTransactions
        .filter(t => t && t.type === 'expense')
        .sort((a, b) => {
          const orderA = expenseCategoryOrder.indexOf(a.category);
          const orderB = expenseCategoryOrder.indexOf(b.category);
          if (orderA !== orderB) return orderA - orderB;
          return parseLocalDateOnly(b.date).getTime() - parseLocalDateOnly(a.date).getTime();
        })
    : dateFilteredTransactions
        .filter(t => t && t.type === 'income')
        .sort((a, b) => {
          const orderA = incomeCategoryOrder.indexOf(a.category);
          const orderB = incomeCategoryOrder.indexOf(b.category);
          if (orderA !== orderB) return orderA - orderB;
          return parseLocalDateOnly(b.date).getTime() - parseLocalDateOnly(a.date).getTime();
        });

  const handlePeriodChange = (period) => {
    if (period === 'calendar') {
      setCalendarOpen(true);
    } else {
      setActivePeriod(period);
      if (period === 'weekly' || period === 'yearly') {
        setSelectedDate(liveToday);
      }
    }
  };

  const handleCalendarApply = (start, end) => {
    setCalendarStart(start);
    setCalendarEnd(end);
    setSelectedDate(start);
    setActivePeriod('calendar');
    setCalendarOpen(false);
  };

  const getCategoryWithEmoji = (transaction) => {
    const categoryLabels = {
      fuel: `⛽ ${t('FUEL')}`,
      food: `🍔🥤 ${t('FOOD')}`,
      load: `📱 ${t('LOAD')}`,
      topup: `🔋 ${t('TOPUP')}`,
      maintenance: `🛠 ${t('MAINTENANCE')}`,
      parking: `🅿️ ${t('PARKING')}`,
      parking_ticket: `🎫 ${t('PARKING_TICKET')}`,
      toll: `🛣️ ${t('TOLL')}`,
      gate_pass: `🎟️ ${t('GATE_PASS')}`,
      wash_cleaning: `🧽 ${t('WASH_CLEANING')}`,
      penalty_violation: `🚨 ${t('PENALTY_VIOLATION')}`,
      permit: `📄 ${t('PERMIT')}`,
      drivers_license_renewal: `🪪 ${t('DRIVERS_LICENSE_RENEWAL')}`,
      vehicle_registration: `🚘 ${t('VEHICLE_REGISTRATION')}`,
      vehicle_insurance: `🛡️ ${t('VEHICLE_INSURANCE')}`,
      other: `🧾 ${t('OTHER')}`,
      gross_income: `💰 ${t('DRIVER_EARNINGS')}`,
      tip: `💸 ${t('TIP')}`,
      extra_income: `💰 ${t('EXTRA_INCOME')}`
    };
    return categoryLabels[transaction.category] || transaction.category;
  };

  return (
    <div
      className={`min-h-screen pb-24 ${
        isDark ? 'page-container' : 'page-container-light'
      } transition-colors`}
    >
      <div className="max-w-screen-lg mx-auto px-3 py-4 space-y-3 overflow-x-hidden">
        <div className="space-y-1">
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('TRANSACTIONS')}
          </h1>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            {t('TRANSACTIONS_SUBTITLE')}
          </p>
        </div>

        {isReadOnly() && <ReadOnlyBanner />}

        <div className="flex items-center justify-end flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            <button 
              onClick={() => {
                if (isReadOnly()) {
                  toast.error(t('UPGRADE_TO_EDIT'));
                } else if (isSpendingLimitLocked) {
                  toast.error('Premium feature. Subscribe to unlock.');
                } else {
                  setExpenseLimitModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all shadow-sm bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black hover:shadow-md"
            >
              <span className="text-sm">💵</span>
              <span>{t('SPENDING_LIMIT')}</span>
              {isSpendingLimitLocked && <span className="text-xs">🔒</span>}
            </button>
          </div>
        </div>

        <AddTransactionModal 
          open={modalOpen} 
          onClose={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
          onSuccess={() => {
            refetch();
            setEditingTransaction(null);
          }}
          editingTransaction={editingTransaction}
          defaultType={editingTransaction?.type || 'expense'}
          lockType={false}
        />

        {/* FIX: Added onSuccess callback so the expense limit row appears
            immediately after saving. Without this, ExpenseLimitModal saved
            to SQLite correctly but Transactions.jsx never re-read from SQLite
            because nothing called refetchLimits() after the modal closed. */}
        <ExpenseLimitModal
          open={expenseLimitModalOpen}
          onClose={() => {
            setExpenseLimitModalOpen(false);
            // Immediately re-query SQLite so the limit row appears
            refetchLimits();
          }}
          activeLimit={activeExpenseLimit}
        />
        
        <DateRangeModal
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          onApply={handleCalendarApply}
          defaultStartDate={format(calendarStart, 'yyyy-MM-dd')}
          defaultEndDate={format(calendarEnd, 'yyyy-MM-dd')}
        />

        <PeriodSelector activePeriod={activePeriod} onPeriodChange={handlePeriodChange} />

        <div className={`text-center py-1.5 px-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white/40 border border-gray-200'}`}>
          {activeExpenseLimit ? (
            <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              {t('LIMIT_LABEL')}: <span className="font-semibold">{formatCurrency(activeExpenseLimit.amount)}</span>
            </p>
          ) : (
            <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {t('NO_LIMIT_SET')}
            </p>
          )}
        </div>
        
        <div className="text-center">
          <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            {uiLabel}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
              activeTab === 'expense'
                ? 'period-btn-active'
                : isDark
                ? 'period-btn-inactive'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {t('EXPENSES_TAB')}
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
              activeTab === 'income'
                ? 'period-btn-active'
                : isDark
                ? 'period-btn-inactive'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {t('INCOME_TAB')}
          </button>
        </div>

        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/60' : 'text-gray-500'} text-sm`}>
              {t('NO_TRANSACTIONS')}
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`rounded-xl p-3 shadow-sm ${
                isDark ? 'card-dark' : 'card-light'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                    {getCategoryWithEmoji(transaction)}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'} mt-0.5`}>
                    {formatDate(transaction.date)}
                  </p>
                  {transaction.type === 'income' && transaction.platform && (
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-gray-500'} mt-0.5 truncate`}>
                      {transaction.platform}
                    </p>
                  )}
                  {transaction.type === 'expense' && transaction.description && (
                    <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-gray-500'} mt-0.5 truncate`}>
                      {transaction.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <div
                    className={`text-sm font-bold whitespace-nowrap ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  {!isReadOnly() && (
                    <>
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setModalOpen(true);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Edit2 className={`w-3.5 h-3.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(transaction)}
                        className={`p-1 rounded transition-colors ${
                          isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className={`max-w-sm ${isDark ? 'card-dark text-white' : 'modal-light'}`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : ''}>{t('DELETE_TRANSACTION')}</DialogTitle>
              <DialogDescription className={isDark ? 'text-white/60' : ''}>
                {t('CANNOT_UNDO')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
                className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
              >
                {t('CANCEL')}
              </Button>
              <Button 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteMutation.isPending ? t('DELETING') : t('DELETE')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
