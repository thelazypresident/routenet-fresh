import React, { useEffect, useMemo, useState } from "react";
import { getDaysInMonth, format, setDate, setMonth, setYear, isAfter } from "date-fns";
import { parseLocalDateOnly, stripTime } from "../utils/dateOnly";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const normalize = (a, b) => (isAfter(a, b) ? { start: b, end: a } : { start: a, end: b });

export default function MonthHistoryPicker({
  isOpen,
  initialStart,
  initialEnd,
  onCancel,
  onClose,
  onApply,
  onApplyRange,
  setCalendarStart,
  setCalendarEnd,
}) {
  const today = stripTime(new Date());

  const [fromMonth, setFromMonth] = useState(today.getMonth());
  const [fromYear, setFromYear] = useState(today.getFullYear());
  const [fromDay, setFromDay] = useState(today.getDate());

  const [toMonth, setToMonth] = useState(today.getMonth());
  const [toYear, setToYear] = useState(today.getFullYear());
  const [toDay, setToDay] = useState(today.getDate());

  useEffect(() => {
    if (!isOpen) return;
    const s = parseLocalDateOnly(initialStart) ?? today;
    const e = parseLocalDateOnly(initialEnd) ?? s;

    setFromMonth(s.getMonth());
    setFromYear(s.getFullYear());
    setFromDay(s.getDate());

    setToMonth(e.getMonth());
    setToYear(e.getFullYear());
    setToDay(e.getDate());
  }, [isOpen]);

  const fromDays = getDaysInMonth(new Date(fromYear, fromMonth, 1));
  const toDays = getDaysInMonth(new Date(toYear, toMonth, 1));

  // clamp day if month/year changes (prevents invalid date like Feb 30)
  useEffect(() => {
    if (fromDay > fromDays) setFromDay(fromDays);
  }, [fromDays, fromDay]);

  useEffect(() => {
    if (toDay > toDays) setToDay(toDays);
  }, [toDays, toDay]);

  const preview = useMemo(() => {
    const a = setDate(setMonth(setYear(new Date(), fromYear), fromMonth), fromDay);
    const b = setDate(setMonth(setYear(new Date(), toYear), toMonth), toDay);
    const r = normalize(a, b);

    return {
      start: r.start,
      end: r.end,
      label: `${format(r.start, "MMM dd, yyyy")} → ${format(r.end, "MMM dd, yyyy")}`,
      range: `${format(r.start, "MM/dd/yyyy")} - ${format(r.end, "MM/dd/yyyy")}`,
      startStr: format(r.start, "yyyy-MM-dd"),
      endStr: format(r.end, "yyyy-MM-dd"),
    };
  }, [fromMonth, fromYear, fromDay, toMonth, toYear, toDay]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => now - 8 + i);
  }, []);

  if (!isOpen) return null;

  const handleOk = () => {
    // 1) set local page state if parent provided setters
    if (typeof setCalendarStart === "function") setCalendarStart(preview.start);
    if (typeof setCalendarEnd === "function") setCalendarEnd(preview.end);

    // 2) call callbacks in BOTH common formats:
    //    a) Dates (start,end)
    if (typeof onApplyRange === "function") onApplyRange(preview.start, preview.end);

    //    b) onApply might expect (start,end) OR ({startDate,endDate})
    if (typeof onApply === "function") {
      try {
        // Try date-pair first
        onApply(preview.start, preview.end);
      } catch (e) {
        // Fallback object format
        onApply({ startDate: preview.startStr, endDate: preview.endStr });
      }
    }

    // 3) close modal (support either name)
    if (typeof onClose === "function") onClose();
    else if (typeof onCancel === "function") onCancel();
  };

  const handleCancel = () => {
    if (typeof onCancel === "function") onCancel();
    else if (typeof onClose === "function") onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl bg-[#0E0F14] border border-white/15 text-white shadow-2xl">

        <div className="p-4 border-b border-white/10">
          <div className="text-sm opacity-70">Select History Range</div>
          <div className="text-xl font-semibold mt-1">{preview.label}</div>
          <div className="text-sm opacity-70 mt-1">{preview.range}</div>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <div className="text-sm font-semibold mb-1">From</div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(Number(e.target.value))}
                className="rounded-xl bg-[#1A1C24] border border-white/20 px-3 py-2"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>

              <select
                value={fromDay}
                onChange={(e) => setFromDay(Number(e.target.value))}
                className="rounded-xl bg-[#1A1C24] border border-white/20 px-3 py-2"
              >
                {Array.from({ length: fromDays }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>

              <select
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className="rounded-xl bg-[#1A1C24] border border-white/20 px-3 py-2"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-1">To</div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={toMonth}
                onChange={(e) => setToMonth(Number(e.target.value))}
                className="rounded-xl bg-[#1A1C24] border border-white/20 px-3 py-2"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>

              <select
                value={toDay}
                onChange={(e) => setToDay(Number(e.target.value))}
                className="rounded-xl bg-[#1A1C24] border border-white/20 px-3 py-2"
              >
                {Array.from({ length: toDays }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>

              <select
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                className="rounded-xl bg-[#1A1C24] border border-white/20 px-3 py-2"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-[#1A1C24] border border-white/20"
          >
            Cancel
          </button>

          <button
            onClick={handleOk}
            className="px-6 py-2 rounded-xl font-semibold text-black
                       bg-gradient-to-r from-green-400 via-emerald-400 to-lime-400"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}