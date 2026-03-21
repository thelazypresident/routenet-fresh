import { useEffect, useState, useCallback, useRef } from 'react';

export function stripTime(d) {
  if (!(d instanceof Date)) return getToday();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const aDate = a instanceof Date ? a : new Date(a);
  const bDate = b instanceof Date ? b : new Date(b);
  return (
    aDate.getFullYear() === bDate.getFullYear() &&
    aDate.getMonth() === bDate.getMonth() &&
    aDate.getDate() === bDate.getDate()
  );
}

export function getToday() {
  return stripTime(new Date());
}

export function useLiveToday(active = true) {
  const [today, setToday] = useState(getToday);
  const timeoutRef = useRef(null);

  const scheduleNextMidnight = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 2
    );
    const ms = nextMidnight.getTime() - now.getTime();

    timeoutRef.current = setTimeout(() => {
      setToday(getToday());
      scheduleNextMidnight();
    }, ms);
  }, []);

  useEffect(() => {
    if (!active) return;

    scheduleNextMidnight();

    // On Android WebView, EVERY tap fires window 'focus'.
    // We must NOT setState on every focus — only when the actual
    // calendar date has changed (i.e. after midnight).
    const handleFocus = () => {
      const newToday = getToday();
      setToday(prev => {
        if (isSameDay(prev, newToday)) return prev; // no change → no re-render
        return newToday;
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) handleFocus();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [active, scheduleNextMidnight]);

  return active ? today : getToday();
}