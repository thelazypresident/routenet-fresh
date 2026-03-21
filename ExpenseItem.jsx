import React, { useState } from 'react';
import { Fuel, Utensils, Smartphone, Wrench, DollarSign, Edit2 } from 'lucide-react';
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

const iconMap = {
  fuel: Fuel,
  food: Utensils,
  load: Smartphone,
  maintenance: Wrench,
  tip: DollarSign
};

export default function ExpenseItem({ category, amount, onAmountChange, theme }) {
  const { t, formatCurrency } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [newAmount, setNewAmount] = useState(amount);

  const Icon = iconMap[category.toLowerCase()] || DollarSign;
  const isDark = theme === 'dark';

  const handleSave = () => {
    if (onAmountChange) {
      onAmountChange(parseFloat(newAmount) || 0);
    }
    setIsEditing(false);
  };

  return (
    <>
      <div
        onClick={() => setIsEditing(true)}
        className={`flex items-center justify-between py-4 px-4 cursor-pointer rounded-lg transition-all ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#66BB6A]/10 border border-[#66BB6A]/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#66BB6A]" />
          </div>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
            {t(category.toUpperCase())}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(amount)}
          </span>
          <Edit2 className={`w-4 h-4 ${isDark ? 'text-[#66BB6A]/50' : 'text-gray-400'}`} />
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className={isDark ? 'card-dark text-white' : 'bg-white'}>
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0B3D2E] via-[#66BB6A] to-[#A5D6A7] rounded-t-lg -mx-6 -mt-6" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-white pt-2">{t('EDIT')} {t(category.toUpperCase())}</DialogTitle>
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
    </>
  );
}