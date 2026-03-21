import React, { useState, useMemo } from 'react';
import { useApp } from '../components/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays
} from 'date-fns';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import DateRangeModal from '../components/DateRangeModal';
import { parseLocalDateOnly } from '../components/utils/dateOnly';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getLocalTransactions } from '@/database/transactionRepository';

export default function Analytics() {
  const { t, theme, user, formatCurrency } = useApp();
  const [activePeriod, setActivePeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(parseLocalDateOnly());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarStart, setCalendarStart] = useState(parseLocalDateOnly());
  const [calendarEnd, setCalendarEnd] = useState(parseLocalDateOnly());

  const isDark = theme === 'dark';

  const getDateRange = () => {
    const today = new Date();

    if (activePeriod === 'daily') {
      const d = selectedDate ?? today;
      return {
        startDate: format(d, 'yyyy-MM-dd'),
        endDateExclusive: format(addDays(d, 1), 'yyyy-MM-dd'),
        uiLabel: format(d, 'MM/dd/yyyy')
      };
    }

    if (activePeriod === 'weekly') {
      const base = selectedDate ?? today;
      const s = startOfWeek(base, { weekStartsOn: 1 });
      const e = endOfWeek(base, { weekStartsOn: 1 });
      return {
        startDate: format(s, 'yyyy-MM-dd'),
        endDateExclusive: format(addDays(e, 1), 'yyyy-MM-dd'),
        uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`
      };
    }

    if (activePeriod === 'monthly') {
      const base = selectedDate ?? today;
      const s = startOfMonth(base);
      const e = endOfMonth(base);
      return {
        startDate: format(s, 'yyyy-MM-dd'),
        endDateExclusive: format(addDays(e, 1), 'yyyy-MM-dd'),
        uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`
      };
    }

    if (activePeriod === 'yearly') {
      const base = selectedDate ?? today;
      const s = startOfYear(base);
      const e = endOfYear(base);
      return {
        startDate: format(s, 'yyyy-MM-dd'),
        endDateExclusive: format(addDays(e, 1), 'yyyy-MM-dd'),
        uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`
      };
    }

    if (activePeriod === 'calendar') {
      return {
        startDate: format(calendarStart, 'yyyy-MM-dd'),
        endDateExclusive: format(addDays(calendarEnd, 1), 'yyyy-MM-dd'),
        uiLabel: `${format(calendarStart, 'MM/dd/yyyy')} - ${format(calendarEnd, 'MM/dd/yyyy')}`
      };
    }

    return {
      startDate: format(today, 'yyyy-MM-dd'),
      endDateExclusive: format(addDays(today, 1), 'yyyy-MM-dd'),
      uiLabel: format(today, 'MM/dd/yyyy')
    };
  };

  const { startDate, endDateExclusive, uiLabel } = useMemo(
    () => getDateRange(),
    [activePeriod, selectedDate, calendarStart, calendarEnd]
  );

  const { data: transactions = [] } = useQuery({
    queryKey: ['analytics-transactions', startDate, endDateExclusive],
    queryFn: async () => {
      

      const allLocal = await getLocalTransactions();

      const getTxDay = (tx) => {
        const d = tx?.transaction_date || tx?.date;
        if (typeof d === 'string' && d.length >= 10) return d.slice(0, 10);
        const ts = tx?.created_at || tx?.createdAt;
        return ts ? format(new Date(ts), 'yyyy-MM-dd') : null;
      };

      return allLocal.filter((t) => {
        const day = getTxDay(t);
        return day && day >= startDate && day < endDateExclusive;
      });
    },
    enabled: true
  });

  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netIncome = totalIncome - totalExpenses;

  const expensesByCategory = expenseTransactions.reduce((acc, t) => {
    const cat = t.category || 'other';
    if (!acc[cat]) {
      acc[cat] = { amount: 0, count: 0 };
    }
    acc[cat].amount += t.amount || 0;
    acc[cat].count += 1;
    return acc;
  }, {});

  const categoryData = Object.entries(expensesByCategory)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const mainCategories = ['fuel', 'food', 'load', 'maintenance'];
  const categoryMap = {};
  let othersAmount = 0;
  let othersCount = 0;

  categoryData.forEach((item) => {
    if (mainCategories.includes(item.category)) {
      categoryMap[item.category] = item;
    } else {
      othersAmount += item.amount;
      othersCount += item.count;
    }
  });

  const donutCategoryData = [];
  mainCategories.forEach((cat) => {
    if (categoryMap[cat]) {
      donutCategoryData.push(categoryMap[cat]);
    }
  });

  if (othersAmount > 0) {
    donutCategoryData.push({
      category: 'other',
      amount: othersAmount,
      count: othersCount,
      percentage: totalExpenses > 0 ? (othersAmount / totalExpenses) * 100 : 0
    });
  }

  const categoryColors = {
    fuel: '#EF5350',
    food: '#FF9800',
    load: '#5C6BC0',
    maintenance: '#26A69A',
    tip: '#9E9E9E',
    topup: '#9E9E9E',
    parking_ticket: '#9E9E9E',
    toll: '#9E9E9E',
    gate_pass: '#9E9E9E',
    wash_cleaning: '#9E9E9E',
    penalty_violation: '#9E9E9E',
    permit: '#9E9E9E',
    drivers_license_renewal: '#9E9E9E',
    vehicle_registration: '#9E9E9E',
    vehicle_insurance: '#9E9E9E',
    sss: '#9E9E9E',
    philhealth: '#9E9E9E',
    pagibig: '#9E9E9E',
    other: '#9E9E9E'
  };

  const categoryNames = {
    fuel: t('CAT_FUEL'),
    food: t('CAT_FOOD'),
    load: t('CAT_LOAD'),
    maintenance: t('CAT_MAINTENANCE'),
    tip: t('CAT_TIP'),
    topup: t('CAT_TOPUP'),
    parking_ticket: t('CAT_PARKING_TICKET'),
    toll: t('CAT_TOLL'),
    gate_pass: t('CAT_GATE_PASS'),
    wash_cleaning: t('CAT_WASH_CLEANING'),
    penalty_violation: t('CAT_PENALTY_VIOLATION'),
    permit: t('CAT_PERMIT'),
    drivers_license_renewal: t('CAT_DRIVERS_LICENSE'),
    vehicle_registration: t('CAT_VEHICLE_REGISTRATION'),
    vehicle_insurance: t('CAT_VEHICLE_INSURANCE'),
    sss: t('CAT_SSS'),
    philhealth: t('CAT_PHILHEALTH'),
    pagibig: t('CAT_PAGIBIG'),
    other: t('CAT_OTHER')
  };

  const handlePeriodChange = (period) => {
    if (period === 'calendar') {
      setCalendarOpen(true);
    } else {
      setActivePeriod(period);
      if (period === 'weekly' || period === 'yearly') {
        setSelectedDate(parseLocalDateOnly());
      }
    }
  };

  const handleCalendarApply = (start, end) => {
    setCalendarStart(start);
    setCalendarEnd(end);
    setActivePeriod('calendar');
    setCalendarOpen(false);
  };

  const handleCalendarCancel = () => {
    setCalendarOpen(false);
  };

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'page-container' : 'page-container-light'}`}>
      <div className="max-w-screen-lg mx-auto px-3 py-4 space-y-3">
        <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('ANALYTICS')}
        </h1>

        <PeriodSelector activePeriod={activePeriod} onPeriodChange={handlePeriodChange} />

        <DateRangeModal
          open={calendarOpen}
          onClose={handleCalendarCancel}
          onApply={handleCalendarApply}
          defaultStartDate={format(calendarStart, 'yyyy-MM-dd')}
          defaultEndDate={format(calendarEnd, 'yyyy-MM-dd')}
        />

        <div className="text-center">
          <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            {uiLabel}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'card-dark' : 'bg-gray-50 rounded-xl'}`}>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t('NO_DATA_PERIOD')}
            </p>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {t('START_ADDING_TRANSACTIONS')}
            </p>
          </div>
        ) : expenseTransactions.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'card-dark' : 'bg-gray-50 rounded-xl'}`}>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t('NO_EXPENSES_PERIOD')}
            </p>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {t('ADD_EXPENSES_BREAKDOWN')}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-center mt-2 mb-1">
              <span className="stat-card-income text-white px-4 py-2.5 rounded-lg flex items-center">
                <span className="text-[10px] font-semibold uppercase">{t('GROSS_INCOME_LABEL')} = </span>
                <span className="text-base font-bold">{formatCurrency(totalIncome)}</span>
              </span>
            </div>

            <div className="pt-1 pb-2 px-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: t('EXPENSES_LABEL'), value: totalExpenses, color: '#EF5350' },
                      { name: t('NET_INCOME_LABEL'), value: Math.max(0, netIncome), color: '#66BB6A' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={130}
                    paddingAngle={0}
                    dataKey="value"
                    stroke={isDark ? '#000000' : '#ffffff'}
                    strokeWidth={2}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="15"
                          fontWeight="700"
                        >
                          {`${Math.min(100, Math.round(percent * 100))}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {[
                      { name: t('EXPENSES_LABEL'), value: totalExpenses, color: '#EF5350' },
                      { name: t('NET_INCOME_LABEL'), value: Math.max(0, netIncome), color: '#66BB6A' }
                    ].map((entry, index) => (
                      <Cell key={`summary-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="stat-card-expense text-white px-4 py-2.5 rounded-lg flex items-center">
                    <span className="text-[10px] font-semibold uppercase">{t('EXPENSES_LABEL')} = </span>
                    <span className="text-base font-bold">{formatCurrency(totalExpenses)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="stat-card-net text-white px-4 py-2.5 rounded-lg flex items-center">
                    <span className="text-[10px] font-semibold uppercase">{t('NET_INCOME_LABEL')} = </span>
                    <span className="text-base font-bold">{formatCurrency(netIncome)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-0 px-6">
              <h3 className={`text-center text-sm font-semibold mb-0 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                {t('EXPENSE_BREAKDOWN_TITLE')}
              </h3>
              <ResponsiveContainer width="100%" height={320} className="-mt-2">
                <PieChart>
                  <Pie
                    data={donutCategoryData.map((item) => ({
                      name: categoryNames[item.category] || item.category,
                      value: item.amount,
                      color: categoryColors[item.category] || '#9E9E9E'
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={130}
                    paddingAngle={0}
                    dataKey="value"
                    stroke={isDark ? '#000000' : '#ffffff'}
                    strokeWidth={2}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="15"
                          fontWeight="700"
                        >
                          {`${Math.min(100, Math.round(percent * 100))}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {donutCategoryData.map((item, index) => (
                      <Cell
                        key={`category-cell-${index}`}
                        fill={categoryColors[item.category] || '#9E9E9E'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-hidden mt-2">
              {donutCategoryData.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColors[item.category] || '#9E9E9E' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {categoryNames[item.category] || item.category}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                          {item.count} {item.count !== 1 ? t('TRANSACTIONS_PLURAL') : t('TRANSACTION_SINGULAR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(item.amount)}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                        {Math.round(item.percentage)}%
                      </p>
                    </div>
                  </div>
                  {index < donutCategoryData.length - 1 && (
                    <div className={`border-b mx-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}