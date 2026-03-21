import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay, isAfter, isSameDay } from 'date-fns';

/**
 * Centralized date-range logic for Dashboard and Transactions.
 * Ensures both pages use identical date filtering.
 */

export const getNormalizedDateRange = (activePeriod, selectedDate, calendarStart, calendarEnd) => {
  const today = new Date();

  // DAILY: the selected day (not always today)
  //
  // FIX: The original code used `periodAnchor = today` for the daily case
  // and completely ignored `selectedDate`. This meant that when the user
  // tapped the ← prev day arrow on Dashboard, `selectedDate` changed to
  // yesterday but the date range was still calculated from today — so the
  // list always showed today's transactions regardless of which day was
  // selected. The fix is to use `selectedDate` when it's provided.
  if (activePeriod === 'daily') {
    const d = selectedDate ?? today;
    const start = startOfDay(d);
    const end = endOfDay(d);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      uiLabel: format(d, 'MM/dd/yyyy'),
      startDateTime: start,
      endDateTime: end
    };
  }

  // WEEKLY: the week containing selectedDate (or today)
  //
  // FIX: Same issue — `periodAnchor` (today) was always used instead of
  // `selectedDate`. If the user navigated to a previous week, the week
  // range was still anchored to the current week.
  if (activePeriod === 'weekly') {
    const base = selectedDate ?? today;
    const s = startOfDay(startOfWeek(base, { weekStartsOn: 1 }));
    const e = endOfDay(endOfWeek(base, { weekStartsOn: 1 }));
    return {
      startDate: format(s, 'yyyy-MM-dd'),
      endDate: format(e, 'yyyy-MM-dd'),
      uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`,
      startDateTime: s,
      endDateTime: e
    };
  }

  // MONTHLY: the month containing selectedDate (or today)
  //
  // FIX: Same issue — use selectedDate so monthly navigation works correctly.
  if (activePeriod === 'monthly') {
    const base = selectedDate ?? today;
    const s = startOfDay(startOfMonth(base));
    const e = endOfDay(endOfMonth(base));
    return {
      startDate: format(s, 'yyyy-MM-dd'),
      endDate: format(e, 'yyyy-MM-dd'),
      uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`,
      startDateTime: s,
      endDateTime: e
    };
  }

  // YEARLY: the year containing selectedDate (or today)
  // (this one was already correct in the original)
  if (activePeriod === 'yearly') {
    const base = selectedDate ?? today;
    const s = startOfDay(startOfYear(base));
    const e = endOfDay(endOfYear(base));
    return {
      startDate: format(s, 'yyyy-MM-dd'),
      endDate: format(e, 'yyyy-MM-dd'),
      uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`,
      startDateTime: s,
      endDateTime: e
    };
  }

  // CALENDAR: custom date range (historical browsing)
  // (unchanged from original — already correct)
  const s0 = calendarStart ?? today;
  const e0 = calendarEnd ?? s0;

  // Normalize range (swap if reversed)
  const normalizeRange = (a, b) => (isAfter(a, b) ? { start: b, end: a } : { start: a, end: b });
  const { start: s, end: e } = normalizeRange(s0, e0);

  const startNormalized = startOfDay(s);
  const endNormalized = endOfDay(e);

  if (isSameDay(s, e)) {
    return {
      startDate: format(startNormalized, 'yyyy-MM-dd'),
      endDate: format(endNormalized, 'yyyy-MM-dd'),
      uiLabel: format(s, 'MM/dd/yyyy'),
      startDateTime: startNormalized,
      endDateTime: endNormalized
    };
  }

  return {
    startDate: format(startNormalized, 'yyyy-MM-dd'),
    endDate: format(endNormalized, 'yyyy-MM-dd'),
    uiLabel: `${format(s, 'MM/dd/yyyy')} - ${format(e, 'MM/dd/yyyy')}`,
    startDateTime: startNormalized,
    endDateTime: endNormalized
  };
};

/**
 * Filter transactions using inclusive date range.
 * Works with both 'yyyy-MM-dd' string dates and Date objects.
 * Unchanged from original — already correct.
 */
export const filterTransactionsByDateRange = (transactions, startDate, endDate) => {
  if (!transactions || !Array.isArray(transactions)) return [];

  // Normalize to date strings for comparison
  const start = typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
  const end = typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd');

  return transactions.filter(t => {
    if (!t || !t.date) return false;
    const tDate = typeof t.date === 'string' ? t.date : format(t.date, 'yyyy-MM-dd');
    // Inclusive on both ends
    return tDate >= start && tDate <= end;
  });
};
