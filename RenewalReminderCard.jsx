import React, { useState, useEffect } from 'react';
import { Calendar, Edit2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function RenewalReminderCard({
  title,
  icon: Icon,
  data = {},
  onSave,
  disabled = false,
  theme
}) {
  const { t } = useApp();
  const isDark = theme === 'dark';

  const buildState = (source = {}) => ({
    expiryDate: source.expiryDate || '',
    reminderDays: source.reminderDays || '7',
    isActive: source.isActive || false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(buildState(data));

  useEffect(() => {
    setFormData(buildState(data));
  }, [data]);

  const handleSave = () => {
    onSave?.({
      ...formData,
      reminderDays: formData.reminderDays ? String(formData.reminderDays) : '7'
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(buildState(data));
    setIsEditing(false);
  };

  const handleToggle = () => {
    if (disabled) return;

    const newActive = !formData.isActive;
    const updated = { ...formData, isActive: newActive };

    setFormData(updated);
    onSave?.(updated);
  };

  const formatDateSafe = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  };

  return (
    <>
      <div
        className={`rounded-xl p-5 shadow-md ${
          isDark ? 'bg-[#003d18]' : 'bg-white'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-[#5aa5a5]/20'}`}>
              <Icon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#5aa5a5]'}`} />
            </div>

            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>

              {formData.expiryDate && (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  Due: {formatDateSafe(formData.expiryDate)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={handleToggle}
              disabled={disabled}
            />

            <button
              onClick={() => !disabled && setIsEditing(true)}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <Edit2 className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {(formData.expiryDate || formData.reminderDays) && (
          <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} space-y-2`}>
            {formData.expiryDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  Expiry: {formatDateSafe(formData.expiryDate)}
                </span>
              </div>
            )}

            {formData.reminderDays && (
              <div className="flex items-center gap-2 text-sm">
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  Remind {formData.reminderDays} day{String(formData.reminderDays) === '1' ? '' : 's'} before
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('EDIT')} {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Expiry Date</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reminder Days Before</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 7"
                value={formData.reminderDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reminderDays: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Active Reminder</span>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              {t('CANCEL')}
            </Button>
            <Button onClick={handleSave} className="bg-[#5aa5a5] hover:bg-[#4a9494]">
              {t('SAVE')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}