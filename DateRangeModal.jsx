import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DatePicker from './ui/DatePicker';
import { useApp } from './contexts/AppContext';
import { format } from 'date-fns';
import { parseLocalDateOnly } from './utils/dateOnly';

export default function DateRangeModal({ open, onClose, onApply, defaultStartDate = '', defaultEndDate = '' }) {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  
  const [dateRange, setDateRange] = useState({
    start: defaultStartDate,
    end: defaultEndDate
  });
  
  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setDateRange({ start: defaultStartDate, end: defaultEndDate });
    }
  }, [open, defaultStartDate, defaultEndDate]);

  const hasCustomDates = dateRange.start && dateRange.end;
  const canApply = hasCustomDates;

  const handleApply = () => {
    if (canApply) {
      onApply(parseLocalDateOnly(dateRange.start), parseLocalDateOnly(dateRange.end));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${isDark ? 'card-dark text-white' : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9] border border-gray-200'} [&>button]:hidden`}>
        <DialogHeader>
          <DialogTitle>Select Date Range</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div>
              <Label className={`text-xs mb-1 block ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Start Date</Label>
              <DatePicker
                value={dateRange.start}
                onChange={(value) => setDateRange(prev => ({ ...prev, start: value }))}
                placeholder="Select start date"
              />
            </div>
            <div>
              <Label className={`text-xs mb-1 block ${isDark ? 'text-white/70' : 'text-gray-600'}`}>End Date</Label>
              <DatePicker
                value={dateRange.end}
                onChange={(value) => setDateRange(prev => ({ ...prev, end: value }))}
                placeholder="Select end date"
              />
            </div>
          </div>

          {!canApply && (
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-white/70 border-red-200'}`}>
              <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                Select a date range first
              </p>
              <p className={`text-xs ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>
                Please choose both Start Date and End Date.
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={onClose}
              variant="outline"
              className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleApply}
              disabled={!canApply}
              className="flex-1 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}