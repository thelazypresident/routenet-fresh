import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, addDays, isAfter, startOfDay } from 'date-fns';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Edit2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { base44 } from '@/api/base44Client';
import { getLocalTransactions } from '@/database/transactionRepository';
import { getLocalExpenseLimits } from '@/database/genericRepository';
import { syncTransactions, syncExpenseLimits } from '@/services/syncService';
import { useQuery } from '@tanstack/react-query';
import { createNotificationAndPush } from '../components/utils/pushNotifications';
import { getNormalizedDateRange, filterTransactionsByDateRange } from '../components/utils/dateRangeHelpers';
import { useLiveToday, isSameDay } from '../components/utils/todayHelpers';
import { parseLocalDateOnly } from '../components/utils/dateOnly';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import StatCard from '../components/dashboard/StatCard';
import ExpenseItem from '../components/dashboard/ExpenseItem';
import DateRangeModal from '../components/DateRangeModal';
import AddTransactionModal from '../components/transactions/AddTransactionModal';
import CategoryDetailsSheet from '../components/dashboard/CategoryDetailsSheet';
import PremiumPaywallSheet from '../components/premium/PremiumPaywallSheet';
import { usePremiumGate } from '../components/premium/usePremiumGate';
import LockedOverlay from '../components/premium/LockedOverlay';
import { useReminderState } from '../components/reminders/useReminderState';
import ReminderBanner from '../components/reminders/ReminderBanner';
import ReminderModal from '../components/reminders/ReminderModal';
import ReadOnlyBanner from '../components/ReadOnlyBanner';

export default function Dashboard() {
  const { t, theme, shouldShowAds, user, isPremium, isTrialActive, isReadOnly, formatCurrency } = useApp();
  const { isOnline } = useOffline();
  const { paywallOpen, paywallContext, closePaywall, checkPremiumAccess } = usePremiumGate();
  const { reminderType, daysRemaining, shouldShowPopup, markPopupShown } = useReminderState();

  const [activePeriod, setActivePeriod] = useState('daily');
  const liveToday = useLiveToday(true);
  const [selectedDate, setSelectedDate] = useState(liveToday);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('expense');

  const isDark = theme === 'dark';

  const [calendarStart, setCalendarStart] = useState(liveToday);
  const [calendarEnd, setCalendarEnd] = useState(liveToday);

  const selectedDayKey = useMemo(() => format(startOfDay(new Date(selectedDate)), 'yyyy-MM-dd'), [selectedDate]);
  const liveDayKey = useMemo(() => format(startOfDay(new Date(liveToday)), 'yyyy-MM-dd'), [liveToday]);
  const prevLiveDayKeyRef = useRef(liveDayKey);

  useEffect(() => {
    if (activePeriod === 'daily') {
      const wasViewingToday = selectedDayKey === prevLiveDayKeyRef.current;
      if (wasViewingToday && liveDayKey !== prevLiveDayKeyRef.current) {
        setSelectedDate(startOfDay(new Date(liveToday)));
      }
    }
    prevLiveDayKeyRef.current = liveDayKey;
  }, [liveDayKey, activePeriod, selectedDayKey, liveToday]);

  const { startDate: helperStartDate, endDate: helperEndDate, uiLabel: helperUiLabel } = useMemo(
    () => {
      const range = getNormalizedDateRange(activePeriod, selectedDate, calendarStart, calendarEnd);
      return range;
    },
    [activePeriod, selectedDate, calendarStart, calendarEnd]
  );

  const dailyStartDate = useMemo(() => startOfDay(new Date(selectedDate)), [selectedDate]);
  const dailyEndDate = useMemo(() => addDays(startOfDay(new Date(selectedDate)), 1), [selectedDate]);

  const startDate = activePeriod === 'daily' ? dailyStartDate : helperStartDate;
  const endDate = activePeriod === 'daily' ? dailyEndDate : helperEndDate;
  const uiLabel = activePeriod === 'daily' ? format(new Date(selectedDate), 'MM/dd/yyyy') : helperUiLabel;

  // Fetch expense limits from SQLite (local-first)
  const { data: expenseLimits = [] } = useQuery({
    queryKey: ['expenseLimits'],
    queryFn: async () => {
      
      if (isOnline) {
        syncExpenseLimits(user?.email).catch(e => console.warn('[Dashboard] expenseLimit sync:', e));
      }
      return getLocalExpenseLimits();
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch transactions from SQLite (local-first source of truth)
  const { data: transactions = [], refetch } = useQuery({
    queryKey: [
      'transactions',
      activePeriod,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    ],
    queryFn: async () => {
      

      const getTxDay = (tx) => {
        const d = tx?.transaction_date || tx?.date;
        if (typeof d === 'string' && d.length >= 10) return d.slice(0, 10);
        const ts = tx?.created_at || tx?.createdAt;
        return ts ? format(new Date(ts), 'yyyy-MM-dd') : null;
      };

      const startKey = format(startDate, 'yyyy-MM-dd');
      const endKeyExclusive = format(endDate, 'yyyy-MM-dd');
      const inRange = (dayKey) => dayKey && dayKey >= startKey && dayKey < endKeyExclusive;

      if (isOnline) {
        syncTransactions(user?.email).catch(e => console.warn('[Dashboard] tx sync:', e));
      }

      const allTx = await getLocalTransactions();

      return allTx
        .filter(tx => inRange(getTxDay(tx)))
        .sort((a, b) => {
          const aTime = a.updated_at || a.created_at || '';
          const bTime = b.updated_at || b.created_at || '';
          return bTime.localeCompare(aTime);
        });
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const incomeTransactions = (transactions || []).filter(t => t && t.type === 'income');
  const expenseTransactions = (transactions || []).filter(t => t && t.type === 'expense');

  const grossIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const driverEarnings = incomeTransactions.filter(t => t.category === 'gross_income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const tipIncome = incomeTransactions.filter(t => t.category === 'tip').reduce((sum, t) => sum + (t.amount || 0), 0);
  const extraIncome = incomeTransactions.filter(t => t.category === 'extra_income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netIncome = grossIncome - totalExpenses;
  const isNetNegative = netIncome < 0;

  // Spending limit notifications
  useEffect(() => {
    // FIX: Guard against offline — createNotificationAndPush and
    // base44.entities.Notification.filter both require network.
    // Without this guard, every totalExpenses change while offline
    // triggered failing network calls and the notification was
    // never written to the local SQLite notification_log table.
    if (!isOnline) return;

    if (!user?.email || !expenseLimits.length || totalExpenses === 0) return;

    const activeLimits = expenseLimits.filter(l => l.is_active);
    if (!activeLimits.length) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    activeLimits.forEach(async (limit) => {
      const percentage = (totalExpenses / limit.amount) * 100;

      if (percentage >= 100) {
        const dedupe_key = `spendlimit_${limit.id}_${today}`;
        const existing = await base44.entities.Notification.filter({ created_by: user.email, dedupe_key });
        const realExisting = existing.filter(n => !n.scheduled_for || new Date(n.scheduled_for).getFullYear() < 2099);
        if (realExisting.length === 0) {
          const notifyTime = limit.notification_time || '08:00';
          const [hours, minutes] = notifyTime.split(':');
          const scheduledDate = new Date();
          scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const scheduledFor = scheduledDate > new Date() ? scheduledDate.toISOString() : new Date().toISOString();
          await createNotificationAndPush({
            type: 'expense_limit', category: 'transactions',
            title: 'Spending Limit Reached',
            message: `You've reached your ${limit.limit_type} spending limit of ₱${limit.amount.toFixed(2)}.`,
            priority: 'high', related_id: limit.id, dedupe_key, is_read: false, scheduled_for: scheduledFor
          }, user);
        }
      } else if (percentage >= 80) {
        const dedupe_key = `spendlimit_warning_${limit.id}_${today}`;
        const existing = await base44.entities.Notification.filter({ created_by: user.email, dedupe_key });
        const realExisting = existing.filter(n => !n.scheduled_for || new Date(n.scheduled_for).getFullYear() < 2099);
        if (realExisting.length === 0) {
          const notifyTime = limit.notification_time || '08:00';
          const [hours, minutes] = notifyTime.split(':');
          const scheduledDate = new Date();
          scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const scheduledFor = scheduledDate > new Date() ? scheduledDate.toISOString() : new Date().toISOString();
          await createNotificationAndPush({
            type: 'expense_limit', category: 'transactions',
            title: 'Spending Limit Warning',
            message: `You're at ${Math.round(percentage)}% of your ${limit.limit_type} spending limit.`,
            priority: 'medium', related_id: limit.id, dedupe_key, is_read: false, scheduled_for: scheduledFor
          }, user);
        }
      }
    });
  }, [totalExpenses, expenseLimits, user, isOnline]);

  const majorCategories = ['fuel', 'food', 'load', 'maintenance'];
  const expenses = {
    fuel: expenseTransactions.filter(t => t.category === 'fuel').reduce((sum, t) => sum + t.amount, 0),
    food: expenseTransactions.filter(t => t.category === 'food').reduce((sum, t) => sum + t.amount, 0),
    load: expenseTransactions.filter(t => t.category === 'load').reduce((sum, t) => sum + t.amount, 0),
    maintenance: expenseTransactions.filter(t => t.category === 'maintenance').reduce((sum, t) => sum + t.amount, 0)
  };

  const minorExpenses = {
    topup: expenseTransactions.filter(t => t.category === 'topup').reduce((sum, t) => sum + t.amount, 0),
    parking: expenseTransactions.filter(t => t.category === 'parking').reduce((sum, t) => sum + t.amount, 0),
    parking_ticket: expenseTransactions.filter(t => t.category === 'parking_ticket').reduce((sum, t) => sum + t.amount, 0),
    toll: expenseTransactions.filter(t => t.category === 'toll').reduce((sum, t) => sum + t.amount, 0),
    gate_pass: expenseTransactions.filter(t => t.category === 'gate_pass').reduce((sum, t) => sum + t.amount, 0),
    wash_cleaning: expenseTransactions.filter(t => t.category === 'wash_cleaning').reduce((sum, t) => sum + t.amount, 0),
    penalty_violation: expenseTransactions.filter(t => t.category === 'penalty_violation').reduce((sum, t) => sum + t.amount, 0),
    permit: expenseTransactions.filter(t => t.category === 'permit').reduce((sum, t) => sum + t.amount, 0),
    drivers_license_renewal: expenseTransactions.filter(t => t.category === 'drivers_license_renewal').reduce((sum, t) => sum + t.amount, 0),
    vehicle_registration: expenseTransactions.filter(t => t.category === 'vehicle_registration').reduce((sum, t) => sum + t.amount, 0),
    vehicle_insurance: expenseTransactions.filter(t => t.category === 'vehicle_insurance').reduce((sum, t) => sum + t.amount, 0),
    helper: expenseTransactions.filter(t => t.category === 'helper').reduce((sum, t) => sum + t.amount, 0),
    other: expenseTransactions.filter(t => t.category === 'other').reduce((sum, t) => sum + t.amount, 0)
  };

  const minorExpensesTotal = Object.values(minorExpenses).reduce((sum, amount) => sum + amount, 0);

  const getCategoryWithEmoji = (category) => {
    const categoryLabels = {
      fuel: { emoji: '⛽', label: t('FUEL') },
      food: { emoji: '🍔🥤', label: t('FOOD') },
      load: { emoji: '📱', label: t('LOAD') },
      topup: { emoji: '🔋', label: t('TOPUP') },
      maintenance: { emoji: '🛠', label: t('MAINTENANCE') },
      tip: { emoji: '💸', label: t('TIP') },
      gross_income: { emoji: '💰', label: t('DRIVER_EARNINGS') },
      extra_income: { emoji: '💰', label: t('EXTRA_INCOME') },
      parking: { emoji: '🅿️', label: t('PARKING') },
      parking_ticket: { emoji: '🎫', label: t('PARKING_TICKET') },
      toll: { emoji: '🛣️', label: t('TOLL') },
      gate_pass: { emoji: '🎟️', label: t('GATE_PASS') },
      wash_cleaning: { emoji: '🧽', label: t('WASH_CLEANING') },
      penalty_violation: { emoji: '🚨', label: t('PENALTY_VIOLATION') },
      permit: { emoji: '📄', label: t('PERMIT') },
      drivers_license_renewal: { emoji: '🪪', label: t('DRIVERS_LICENSE_RENEWAL') },
      vehicle_registration: { emoji: '🚘', label: t('VEHICLE_REGISTRATION') },
      vehicle_insurance: { emoji: '🛡️', label: t('VEHICLE_INSURANCE') },
      helper: { emoji: '🤝', label: t('HELPER') },
      other: { emoji: '🧾', label: t('OTHER') }
    };
    const config = categoryLabels[category];
    return config ? `${config.emoji} ${config.label}` : category;
  };

  const getCategoryLabel = (category) => {
    const categoryLabels = {
      fuel: t('FUEL'), food: t('FOOD'), load: t('LOAD'), topup: t('TOPUP'),
      maintenance: t('MAINTENANCE'), tip: t('TIP'), gross_income: t('DRIVER_EARNINGS'),
      extra_income: t('EXTRA_INCOME'), parking: t('PARKING'), parking_ticket: t('PARKING_TICKET'),
      toll: t('TOLL'), gate_pass: t('GATE_PASS'), wash_cleaning: t('WASH_CLEANING'),
      penalty_violation: t('PENALTY_VIOLATION'), permit: t('PERMIT'),
      drivers_license_renewal: t('DRIVERS_LICENSE_RENEWAL'),
      vehicle_registration: t('VEHICLE_REGISTRATION'),
      vehicle_insurance: t('VEHICLE_INSURANCE'), helper: t('HELPER'), other: t('OTHER')
    };
    return categoryLabels[category] || category;
  };

  const openCategorySheet = (type, category) => {
    if (type === 'expense') {
      if (!checkPremiumAccess('Dashboard Expenses')) return;
    }
    setCategorySheetData({ type, categoryKey: category });
    setCategorySheetOpen(true);
  };

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

  const handleCalendarCancel = () => setCalendarOpen(false);

  const [formData, setFormData] = useState({ type: 'expense', category: '', editingTransaction: null, disableAutoEdit: false });
  const [lockType, setLockType] = useState(true);
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [categorySheetData, setCategorySheetData] = useState({ type: 'expense', categoryKey: null });

  const openAddForCategory = (type, category) => {
    if (isReadOnly()) {
      toast.error('Upgrade to unlock editing');
      return;
    }
    if (type === 'expense') {
      if (!checkPremiumAccess('Dashboard Expenses')) return;
    }
    setModalDefaultType(type);
    setFormData({ type, category, editingTransaction: null, disableAutoEdit: true });
    setLockType(true);
    setAddModalOpen(true);
  };

  const showAd = shouldShowAds();

  const safeDate = startOfDay(
    selectedDate && !isNaN(new Date(selectedDate).getTime())
      ? new Date(selectedDate)
      : new Date(liveToday)
  );

  const displayDate = format(safeDate, 'MM/dd/yyyy');

  const handlePrevDay = () => {
    setSelectedDate(prev => startOfDay(addDays(new Date(prev), -1)));
    setActivePeriod('daily');
  };

  const nextDate = startOfDay(addDays(safeDate, 1));
  const isNextDisabled = isAfter(startOfDay(nextDate), startOfDay(new Date()));

  const handleNextDay = () => {
    if (isNextDisabled) return;
    setSelectedDate(nextDate);
    setActivePeriod('daily');
  };

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'page-container' : 'page-container-light'} transition-colors`}>
      <div className="max-w-screen-lg mx-auto px-3 py-3 space-y-2">

        <PeriodSelector activePeriod={activePeriod} onPeriodChange={handlePeriodChange} />

        {isReadOnly() && <ReadOnlyBanner />}

        {reminderType && <ReminderBanner reminderType={reminderType} daysRemaining={daysRemaining} />}

        <DateRangeModal
          open={calendarOpen}
          onClose={handleCalendarCancel}
          onApply={handleCalendarApply}
          defaultStartDate={format(calendarStart, 'yyyy-MM-dd')}
          defaultEndDate={format(calendarEnd, 'yyyy-MM-dd')}
        />

        <AddTransactionModal
          open={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            setFormData({ type: 'expense', category: '', editingTransaction: null, disableAutoEdit: false });
          }}
          onSuccess={() => { refetch(); }}
          defaultType={formData.type}
          defaultCategory={formData.category}
          lockType={lockType}
          lockCategory={!!formData.category}
          selectedDate={format(
            activePeriod === 'calendar' ? calendarStart : (activePeriod === 'daily' ? new Date(selectedDate) : liveToday),
            'yyyy-MM-dd'
          )}
          editingTransaction={formData.editingTransaction}
          disableAutoEdit={formData.disableAutoEdit || false}
        />

        <PremiumPaywallSheet open={paywallOpen} onClose={closePaywall} context={paywallContext} />

        <ReminderModal
          open={shouldShowPopup}
          onClose={markPopupShown}
          reminderType={reminderType}
          daysRemaining={daysRemaining}
        />

        {categorySheetOpen && (
          <CategoryDetailsSheet
            open={categorySheetOpen}
            onClose={() => setCategorySheetOpen(false)}
            type={categorySheetData.type}
            categoryKey={categorySheetData.categoryKey}
            categoryLabel={categorySheetData.categoryKey ? getCategoryLabel(categorySheetData.categoryKey) : ''}
            startDate={startDate}
            endDate={endDate}
            selectedDate={selectedDate}
            activePeriod={activePeriod}
            onRefresh={() => { refetch(); }}
          />
        )}

        {/* Date navigator */}
        <div className="text-center">
          {activePeriod === 'daily' ? (
            <div className="flex items-center justify-center gap-2 py-0.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors border ${
                  isDark ? 'border-white/20 hover:bg-white/10 active:bg-white/20' : 'border-gray-300 hover:bg-black/5 active:bg-black/10'
                }`}
                aria-label="Previous date"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={isDark ? 'text-white/70' : 'text-gray-700'}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className={`text-sm font-semibold tabular-nums px-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                {displayDate}
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                disabled={isNextDisabled}
                className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors border ${
                  isDark ? 'border-white/20 hover:bg-white/10 active:bg-white/20' : 'border-gray-300 hover:bg-black/5 active:bg-black/10'
                } ${isNextDisabled ? 'opacity-30 pointer-events-none' : ''}`}
                aria-label="Next date"
              >
                <ChevronRight className={isDark ? 'w-5 h-5 text-white/70' : 'w-5 h-5 text-gray-700'} />
              </button>
            </div>
          ) : (
            <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{uiLabel}</p>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatCard title="Income" amount={grossIncome} color="blue" />
          <StatCard title="Expenses" amount={totalExpenses} color="red" />
        </div>

        {/* Expense Breakdown */}
        <div className={`rounded-xl relative ${isDark ? 'card-dark' : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9] border border-gray-200'}`}>
          {!isPremium() && !isTrialActive() && (
            <LockedOverlay
              title="Premium Feature"
              subtitle="Track expenses with Premium"
              onClick={() => checkPremiumAccess('Dashboard Expenses')}
            />
          )}
          <div className={`p-2 border-b ${isDark ? 'border-[#66BB6A]/10' : 'border-gray-200'}`}>
            <h3 className={`text-xs uppercase tracking-wide font-semibold ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Expenses</h3>
          </div>
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
            {majorCategories.map(category => (
              <button
                key={category}
                onClick={() => openCategorySheet('expense', category)}
                type="button"
                className="w-full px-3 py-1.5 grid items-center grid-cols-[minmax(0,1fr)_110px] hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-start min-w-0 text-left">
                  <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {getCategoryWithEmoji(category)}
                  </span>
                </div>
                <div className="w-full text-right whitespace-nowrap tabular-nums justify-self-end">
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(expenses[category] || 0)}</span>
                </div>
              </button>
            ))}

            <div>
              <button
                onClick={() => setOthersExpanded(!othersExpanded)}
                className="w-full px-3 py-1.5 grid items-center grid-cols-[minmax(0,1fr)_84px_110px] hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    🧾 {t('OTHERS')}
                  </span>
                  {othersExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </div>
                <div className="w-[84px] justify-self-end" />
                <div className="w-full text-right whitespace-nowrap tabular-nums justify-self-end">
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(minorExpensesTotal)}</span>
                </div>
              </button>

              {othersExpanded && (
                <div className={isDark ? 'bg-white/5' : 'bg-white/40'}>
                  {Object.entries(minorExpenses).map(([category, amount]) => (
                    <button
                      key={category}
                      onClick={() => openCategorySheet('expense', category)}
                      type="button"
                      className={`w-full px-3 py-1.5 grid items-center grid-cols-[minmax(0,1fr)_110px] border-t hover:opacity-80 transition-opacity ${isDark ? 'border-white/5' : 'border-gray-100'}`}
                    >
                      <div className="flex items-center justify-start min-w-0 text-left">
                        <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {getCategoryWithEmoji(category)}
                        </span>
                      </div>
                      <div className="w-full text-right whitespace-nowrap tabular-nums justify-self-end">
                        <span className="text-sm font-semibold text-red-500">{formatCurrency(Number(amount) || 0)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <StatCard title="Net Profit" amount={netIncome} color={isNetNegative ? 'red' : 'green'} tooltip="This is not your bank balance." />

        {/* Driver Earnings */}
        <button
          onClick={() => openCategorySheet('income', 'gross_income')}
          type="button"
          className={`w-full rounded-xl px-4 py-2.5 grid items-center grid-cols-[minmax(0,1fr)_110px] hover:opacity-80 transition-opacity ${isDark ? 'card-dark' : 'bg-white/70 border border-gray-200'}`}
        >
          <div className="flex items-center justify-start min-w-0 text-left">
            <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{getCategoryWithEmoji('gross_income')}</span>
          </div>
          <div className="w-full text-right whitespace-nowrap tabular-nums justify-self-end">
            <span className="text-sm font-semibold text-green-500">{formatCurrency(driverEarnings)}</span>
          </div>
        </button>

        {/* Tips */}
        <button
          onClick={() => openCategorySheet('income', 'tip')}
          type="button"
          className={`w-full rounded-xl px-4 py-2.5 grid items-center grid-cols-[minmax(0,1fr)_110px] hover:opacity-80 transition-opacity ${isDark ? 'card-dark' : 'bg-white/70 border border-gray-200'}`}
        >
          <div className="flex items-center justify-start min-w-0 text-left">
            <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{getCategoryWithEmoji('tip')}</span>
          </div>
          <div className="w-full text-right whitespace-nowrap tabular-nums justify-self-end">
            <span className="text-sm font-semibold text-green-500">{formatCurrency(tipIncome)}</span>
          </div>
        </button>

        {/* Extra Income */}
        <button
          onClick={() => openCategorySheet('income', 'extra_income')}
          type="button"
          className={`w-full rounded-xl px-4 py-2.5 grid items-center grid-cols-[minmax(0,1fr)_110px] hover:opacity-80 transition-opacity ${isDark ? 'card-dark' : 'bg-white/70 border border-gray-200'}`}
        >
          <div className="flex items-center justify-start min-w-0 text-left">
            <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{getCategoryWithEmoji('extra_income')}</span>
          </div>
          <div className="w-full text-right whitespace-nowrap tabular-nums justify-self-end">
            <span className="text-sm font-semibold text-green-500">{formatCurrency(extraIncome)}</span>
          </div>
        </button>

        {showAd && (
          <div className="bg-gray-800 text-white text-center rounded-lg overflow-hidden shadow-lg">
            <div className="h-[50px] flex items-center justify-center">
              <p className="text-sm font-medium">[320x50 Advertisement Banner]</p>
            </div>
            <div className="bg-gray-900 py-2">
              <p className="text-xs opacity-70">{t('UPGRADE_TO_PRO')} for ad-free experience</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
