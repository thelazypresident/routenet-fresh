import React, { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isAfter,
  isWithinInterval,
  setMonth,
  setYear,
} from "date-fns";
import { parseLocalDateOnly } from "../utils/dateOnly";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function clampRange(a, b) {
  return isAfter(a, b) ? { start: b, end: a } : { start: a, end: b };
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function IOSCalendarPicker({
  isOpen,
  mode = "range",
  initialStart,
  initialEnd,
  onCancel,
  onApply,
  isDark = true,
}) {
  const today = stripTime(new Date());

  const [showYearGrid, setShowYearGrid] = useState(false);

  // Month currently being viewed
  const [viewDate, setViewDate] = useState(stripTime(parseLocalDateOnly(initialStart) ?? today));

  // Draft selection
  const [start, setStart] = useState(stripTime(parseLocalDateOnly(initialStart) ?? today));
  const [end, setEnd] = useState(stripTime(parseLocalDateOnly(initialEnd ?? initialStart) ?? today));

  useEffect(() => {
    if (!isOpen) return;
    const s = stripTime(parseLocalDateOnly(initialStart) ?? today);
    const e = stripTime(parseLocalDateOnly(initialEnd ?? initialStart) ?? today);
    setViewDate(s);
    setStart(s);
    setEnd(e);
    setShowYearGrid(false);
  }, [isOpen, initialStart, initialEnd]);

  const yearList = useMemo(() => {
    const startYear = 2019;
    const endYear = 2033;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, []);

  const headerText = useMemo(() => {
    if (mode === "single" || isSameDay(start, end)) {
      return format(start, "EEE, MMM d");
    }
    const { start: s, end: e } = clampRange(start, end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    return sameMonth
      ? `${format(s, "MMM d")} \u2013 ${format(e, "d")}`
      : `${format(s, "MMM d")} \u2013 ${format(e, "MMM d")}`;
  }, [mode, start, end]);

  const monthTitle = useMemo(() => {
    return `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  }, [viewDate]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const result = [];
    let cur = gridStart;

    while (cur <= gridEnd) {
      result.push({ date: cur, inMonth: cur.getMonth() === viewDate.getMonth() });
      cur = addDays(cur, 1);
    }
    return result;
  }, [viewDate]);

  const isInRange = (d) => {
    if (mode === "single") return false;
    const { start: s, end: e } = clampRange(start, end);
    if (isSameDay(s, e)) return false;
    return isWithinInterval(d, { start: s, end: e });
  };

  const isStart = (d) => isSameDay(d, start);
  const isEnd = (d) => isSameDay(d, end);

  const handleDayTap = (dRaw) => {
    const d = stripTime(dRaw);

    if (mode === "single") {
      setStart(d);
      setEnd(d);
      return;
    }

    const single = isSameDay(start, end);

    if (single) {
      setStart(d);
      setEnd(d);
      return;
    }

    setStart(d);
    setEnd(d);
  };

  const handleSecondTapForRange = (dRaw) => {
    const d = stripTime(dRaw);
    if (mode === "single") return;

    if (isSameDay(start, end)) {
      const norm = clampRange(start, d);
      setStart(norm.start);
      setEnd(norm.end);
      return;
    }

    setStart(d);
    setEnd(d);
  };

  const handleCellClick = (d) => {
    if (mode === "single") return handleDayTap(d);

    if (isSameDay(start, end)) handleSecondTapForRange(d);
    else handleDayTap(d);
  };

  const gotoPrevMonth = () => setViewDate((p) => addMonths(p, -1));
  const gotoNextMonth = () => setViewDate((p) => addMonths(p, 1));

  const handleYearPick = (y) => {
    setViewDate((prev) => setYear(prev, y));
    setShowYearGrid(false);
  };

  const handleMonthPick = (m) => {
    setViewDate((prev) => setMonth(prev, m));
  };

  const ok = () => {
    const norm = clampRange(start, end);
    onApply(norm.start, norm.end);
  };

  if (!isOpen) return null;

  return (
    <div className={`w-full max-w-md mx-auto rounded-3xl border p-4 ${
      isDark 
        ? 'border-white/10 bg-black/40 backdrop-blur-xl' 
        : 'border-gray-200 bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-xs ${isDark ? 'opacity-70' : 'text-gray-500'}`}>Select date</div>
          <div className={`text-3xl font-semibold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{headerText}</div>
        </div>
        <button
          className="mt-2 h-10 w-10 rounded-full border border-white/10 bg-white/5 text-lg"
          onClick={() => setShowYearGrid((v) => !v)}
          aria-label="Toggle year picker"
          title="Toggle year picker"
        >
          ✎
        </button>
      </div>

      {/* Month row */}
      <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <button
          className={`px-2 py-2 rounded-xl border ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white' 
              : 'border-gray-200 bg-white/40 text-gray-900'
          }`}
          onClick={() => setShowYearGrid((v) => !v)}
          title="Select month/year"
        >
          {monthTitle} <span className={isDark ? 'opacity-70' : 'text-gray-500'}>▾</span>
        </button>

        <div className="flex gap-2">
          <button
            className={`h-9 w-9 rounded-xl border ${
              isDark 
                ? 'border-white/10 bg-white/5 text-white' 
                : 'border-gray-200 bg-white/40 text-gray-900'
            }`}
            onClick={gotoPrevMonth}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            className={`h-9 w-9 rounded-xl border ${
              isDark 
                ? 'border-white/10 bg-white/5 text-white' 
                : 'border-gray-200 bg-white/40 text-gray-900'
            }`}
            onClick={gotoNextMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Year grid OR Calendar */}
      {showYearGrid ? (
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            {yearList.map((y) => {
              const active = y === viewDate.getFullYear();
              return (
                <button
                  key={y}
                  onClick={() => handleYearPick(y)}
                  className={[
                    "h-12 rounded-2xl border text-sm",
                    active
                      ? isDark 
                        ? "border-white/30 bg-white/15 font-semibold text-white"
                        : "border-gray-300 bg-white/60 font-semibold text-gray-900"
                      : isDark
                      ? "border-white/10 bg-white/5 text-white"
                      : "border-gray-200 bg-white/30 text-gray-700",
                  ].join(" ")}
                >
                  {y}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {MONTHS.map((m, idx) => {
              const active = idx === viewDate.getMonth();
              return (
                <button
                  key={m}
                  onClick={() => handleMonthPick(idx)}
                  className={[
                    "h-11 rounded-2xl border text-xs px-2",
                    active
                      ? isDark
                        ? "border-white/30 bg-white/15 font-semibold text-white"
                        : "border-gray-300 bg-white/60 font-semibold text-gray-900"
                      : isDark
                      ? "border-white/10 bg-white/5 text-white"
                      : "border-gray-200 bg-white/30 text-gray-700",
                  ].join(" ")}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {/* Week labels */}
          <div className={`grid grid-cols-7 text-xs mb-2 ${isDark ? 'opacity-70 text-white' : 'text-gray-500'}`}>
            {["S","M","T","W","T","F","S"].map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map(({ date, inMonth }, idx) => {
              const d = stripTime(date);
              const selectedStart = isStart(d);
              const selectedEnd = isEnd(d);
              const inBetween = isInRange(d);
              const isToday = isSameDay(d, today);

              const base =
                "h-10 rounded-2xl text-sm border flex items-center justify-center select-none";

              const styles = selectedStart || selectedEnd
                ? isDark
                  ? "border-white/30 bg-white/20 font-semibold text-white"
                  : "border-gray-300 bg-white/60 font-semibold text-gray-900"
                : inBetween
                ? isDark
                  ? "border-white/10 bg-white/10 text-white"
                  : "border-gray-200 bg-white/40 text-gray-900"
                : isDark
                ? "border-white/10 bg-white/5 text-white"
                : "border-gray-200 bg-white/30 text-gray-700";

              const muted = inMonth ? "" : "opacity-40";
              const todayRing = isToday 
                ? isDark ? "ring-1 ring-white/30" : "ring-1 ring-gray-300"
                : "";

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(d)}
                  className={[base, styles, muted, todayRing].join(" ")}
                >
                  {format(d, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className={`px-4 py-2 rounded-2xl border text-sm ${
            isDark 
              ? 'border-white/10 bg-white/5 text-white' 
              : 'border-gray-200 bg-white/40 text-gray-700'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={ok}
          className={`px-5 py-2 rounded-2xl border text-sm font-semibold ${
            isDark 
              ? 'border-white/10 bg-white/15 text-white' 
              : 'border-gray-300 bg-white/60 text-gray-900'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}