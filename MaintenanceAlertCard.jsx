import React, { useState, useEffect } from 'react';
import { Calendar, Gauge, Edit2 } from 'lucide-react';
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

export default function MaintenanceAlertCard({
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
    lastServiceDate: source.lastServiceDate || '',
    lastServiceKm: source.lastServiceKm || '',
    nextDueDate: source.nextDueDate || '',
    nextDueKm: source.nextDueKm || '',
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
      lastServiceKm: formData.lastServiceKm ? String(formData.lastServiceKm) : '',
      nextDueKm: formData.nextDueKm ? String(formData.nextDueKm) : '',
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

              {formData.nextDueDate && (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  Due: {formatDateSafe(formData.nextDueDate)}
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

        {(formData.lastServiceDate || formData.lastServiceKm) && (
          <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} space-y-2`}>
            {formData.lastServiceDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  Last: {formatDateSafe(formData.lastServiceDate)}
                </span>
              </div>
            )}

            {formData.lastServiceKm && (
              <div className="flex items-center gap-2 text-sm">
                <Gauge className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  {formData.lastServiceKm} km
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
              <label className="text-sm font-medium mb-2 block">Last Service Date</label>
              <Input
                type="date"
                value={formData.lastServiceDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastServiceDate: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Last Service Odometer (km)</label>
              <Input
                type="number"
                placeholder="e.g., 15000"
                value={formData.lastServiceKm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastServiceKm: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Next Due Date</label>
              <Input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nextDueDate: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Next Due Odometer (km)</label>
              <Input
                type="number"
                placeholder="e.g., 18000"
                value={formData.nextDueKm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nextDueKm: e.target.value }))
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