import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Preferences } from '@capacitor/preferences';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// FIX: The original only saved the toggle to Base44 — if offline, the save
// failed and the toggle snapped back on next app load. Fix: save to
// Capacitor Preferences immediately (device-local), then sync to Base44
// if online. On load, read from Preferences as a fallback if user object
// isn't yet available or has no value set.

const REMINDERS_PREF_KEY = 'routenet_reminders_enabled';

export default function NotificationsAutomation() {
  const navigate = useNavigate();
  const { theme, user, setUser } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === 'dark';

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load initial value — prefer user object, fall back to Preferences
  useEffect(() => {
    if (user?.reminders_enabled !== undefined) {
      setRemindersEnabled(user.reminders_enabled ?? true);
    } else {
      Preferences.get({ key: REMINDERS_PREF_KEY })
        .then(({ value }) => {
          if (value !== null) setRemindersEnabled(value !== 'false');
        })
        .catch(() => {});
    }
  }, [user?.reminders_enabled]);

  const handleRemindersToggle = async (checked) => {
    if (!user) return;

    const previous = remindersEnabled;
    setRemindersEnabled(checked);
    setSaving(true);

    try {
      // FIX: Save to Preferences immediately — works offline
      await Preferences.set({ key: REMINDERS_PREF_KEY, value: String(checked) });

      // Sync to Base44 if online
      if (isOnline) {
        await base44.auth.updateMe({ reminders_enabled: checked });
        const updatedUser = await base44.auth.me();
        setUser(updatedUser);
      } else {
        // Update in-memory user state so AppContext reflects the change
        setUser(prev => ({ ...prev, reminders_enabled: checked }));
      }

      toast.success(checked ? 'Reminders enabled' : 'Reminders disabled');
    } catch (error) {
      console.error('[NotificationsAutomation] toggle failed:', error);
      // Revert UI and Preferences on failure
      setRemindersEnabled(previous);
      await Preferences.set({ key: REMINDERS_PREF_KEY, value: String(previous) }).catch(() => {});
      toast.error('Failed to update reminder setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`min-h-screen pb-20 ${
        isDark
          ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]'
          : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
      }`}
    >
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">
        <button
          onClick={() => navigate(createPageUrl('Notifications'))}
          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/20'
              : 'bg-white/60 hover:bg-white/80 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </span>
          </div>
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
        </button>

        <div
          className={`rounded-2xl transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10'
              : 'bg-white/60 border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <Bell className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Reminders
              </span>
            </div>
            <Switch
              checked={remindersEnabled}
              onCheckedChange={handleRemindersToggle}
              disabled={saving}
            />
          </div>

          <p className={`px-4 pb-4 text-xs pl-[52px] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Get reminders about savings goals, renewals, maintenance, and spending alerts.
          </p>

          {!isOnline && (
            <p className="px-4 pb-3 text-xs pl-[52px] text-yellow-500">
              📵 Offline — setting saved locally, will sync when reconnected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
