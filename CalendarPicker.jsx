import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import ModalContainer from '../ui/ModalContainer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '../contexts/AppContext';
import GreenCloseButton from '../ui/GreenCloseButton';
import { getToday } from '../utils/todayHelpers';
import { parseLocalDateOnly } from '../utils/dateOnly';

export default function CalendarPicker({ open, onClose, onSelectDate, markedDates = [], onDayClick, onDone, rangeStart, rangeEnd }) {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  
  const today = getToday();
  const [viewDate, setViewDate] = useState(parseLocalDateOnly(rangeStart) ?? today);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  // Sync viewDate to rangeStart when it changes
  React.useEffect(() => {
    if (rangeStart) setViewDate(parseLocalDateOnly(rangeStart));
  }, [rangeStart]);
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };
  
  const hasTransactions = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return markedDates.includes(dateStr);
  };
  
  const onMonthChange = (monthIndex) => {
    const newDate = new Date(year, parseInt(monthIndex), 1);
    setViewDate(newDate);
    setSelectedDay(null);
  };
  
  const onYearChange = (yearValue) => {
    const newDate = new Date(parseInt(yearValue), month, 1);
    setViewDate(newDate);
    setSelectedDay(null);
  };
  
  const handleDateClick = (day) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDay(day);
    
    // If parent provides onDayClick, use it for range selection
    if (onDayClick) {
      onDayClick(clickedDate);
    }
  };
  
  const handleConfirm = () => {
    if (selectedDay) {
      const selectedDate = new Date(year, month, selectedDay);
      if (!isNaN(selectedDate.getTime())) {
        // Use onDone if provided (for range), otherwise onSelectDate
        if (onDone) {
          onDone();
        } else {
          onSelectDate(selectedDate);
          onClose();
        }
      }
    }
  };
  
  // Reset to current month/today when opening
  React.useEffect(() => {
    if (open) {
      const base = parseLocalDateOnly(rangeStart) ?? today;
      setViewDate(base);
      setSelectedDay(base.getDate());
    }
  }, [open, rangeStart]);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayDate = new Date(year, month, day);
    const isSelected = selectedDay === day;
    
    // Check if this day is in the selected range
    const isInRange = rangeStart && rangeEnd && 
      currentDayDate >= rangeStart && 
      currentDayDate <= rangeEnd;
    
    const isRangeStart = rangeStart && 
      currentDayDate.getDate() === rangeStart.getDate() &&
      currentDayDate.getMonth() === rangeStart.getMonth() &&
      currentDayDate.getFullYear() === rangeStart.getFullYear();
    
    const isRangeEnd = rangeEnd && 
      currentDayDate.getDate() === rangeEnd.getDate() &&
      currentDayDate.getMonth() === rangeEnd.getMonth() &&
      currentDayDate.getFullYear() === rangeEnd.getFullYear();
    
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`
          aspect-square rounded-lg flex flex-col items-center justify-center relative
          transition-colors
          ${(isRangeStart || isRangeEnd)
            ? 'bg-[#66BB6A] text-white font-bold'
            : isInRange
            ? 'bg-[#66BB6A]/20 text-white font-semibold'
            : isToday(day) 
            ? 'bg-[#5aa5a5] text-white font-bold' 
            : isDark 
              ? 'text-white hover:bg-white/10' 
              : 'text-gray-900 hover:bg-gray-100'
          }
        `}
      >
        <span>{day}</span>
        {hasTransactions(day) && (
          <div className={`absolute bottom-1 w-1 h-1 rounded-full ${
            isToday(day) || isRangeStart || isRangeEnd ? 'bg-white' : 'bg-[#5aa5a5]'
          }`} />
        )}
      </button>
    );
  }
  
  return (
    <ModalContainer 
      open={open} 
      onClose={onClose} 
      isDark={isDark}
      className={isDark ? 'bg-gradient-to-b from-[#000000] via-[#02140A] to-[#062A14] border border-white/10' : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'}
      title="Select Date"
    >
      <div className="space-y-4">
          {/* Month and Year Selectors */}
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={onMonthChange}>
              <SelectTrigger className={`flex-1 ${isDark ? 'dark-select-trigger' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDark ? 'dark-select-content' : 'light-select-content'}>
                {monthNames.map((monthName, idx) => (
                  <SelectItem key={idx} value={String(idx)}>{monthName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={onYearChange}>
              <SelectTrigger className={`w-24 ${isDark ? 'dark-select-trigger' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDark ? 'dark-select-content' : 'light-select-content'}>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className={`text-center text-sm font-semibold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
            {days}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDay}
              className="flex-1 btn-primary"
            >
              Done
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}