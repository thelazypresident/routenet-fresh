import React, { useState } from 'react';
import { Edit2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApp } from '../contexts/AppContext';

export default function StatCard({ title, amount, color, editable = false, onAmountChange, onAdd, onClick, tooltip }) {
  const { t, formatCurrency, theme } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [newAmount, setNewAmount] = useState(amount);
  const isDark = theme === 'dark';

  const handleSave = () => {
    if (onAmountChange) {
      onAmountChange(parseFloat(newAmount) || 0);
    }
    setIsEditing(false);
  };

  const cardClass = color === 'green' ? 'stat-card-net' : color === 'blue' ? 'stat-card-income' : 'stat-card-expense';

  return (
    <>
      <div className={`${cardClass} rounded-xl p-2 relative transition-all min-h-[64px] max-h-[72px]`}>
        <div className="flex items-center justify-between h-full">
          <button
            onClick={onClick}
            disabled={!onClick}
            className={`flex-1 min-w-0 text-left ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-[14px] font-medium uppercase tracking-wider text-white/50">
                {title}
              </h3>
              {tooltip && (
                <div className="relative group">
                  <Info className="w-3.5 h-3.5 text-white/70 cursor-help" />
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
                    isDark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                  } shadow-lg`}>
                    {tooltip}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[18px] font-medium text-white">
              {amount < 0 ? `-${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
            </p>
          </button>
          {typeof onAdd === 'function' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/15 transition-colors ml-1"
            >
              <Plus className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {editable && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('EDIT')} {title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">{t('AMOUNT')}</label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="btn-secondary">
                {t('CANCEL')}
              </Button>
              <Button onClick={handleSave} className="btn-primary">
                {t('SAVE')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}