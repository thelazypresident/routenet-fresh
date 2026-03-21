import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalContainer from '../components/ui/ModalContainer';
import GreenCloseButton from '../components/ui/GreenCloseButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import { Bell, BellOff, Edit2, Wrench, RotateCcw, ArrowLeft, Trash2 } from 'lucide-react';
import DatePicker from '../components/ui/DatePicker';
import TimePickerInput from '../components/ui/TimePickerInput';
import { Preferences } from '@capacitor/preferences';
import {
  createLocalMaintenance,
  updateLocalMaintenance,
  deleteLocalMaintenance,
  getLocalMaintenance,
} from '@/database/genericRepository';
import { syncMaintenance } from '@/services/syncService';
import {
  scheduleMaintenanceNotification,
  cancelReminderNotification,
} from '@/services/reminderEngine';

// FIX: This page was entirely cloud-only — all 3 entity queries (MaintenanceTracker,
// CustomMaintenance, MaintenanceHistory) called Base44 directly with no SQLite
// fallback. This caused:
//   - Page completely empty offline (all queries return empty)
//   - Data disappears after app close when offline
//   - Page disabled/unresponsive while network is slow
//   - Notifications used base44.functions.invoke('scheduleRenewalPush') —
//     server-only, fails offline and only works after cloud sync
//
// THE FIX:
//   - Maintenance items → SQLite maintenance table (local-first)
//   - Odometer tracker → Capacitor Preferences (simple key-value, device-local)
//   - Service history → Capacitor Preferences (JSON array, device-local)
//   - Notifications → scheduleMaintenanceNotification() (LocalNotifications, device OS)
//   - seedPresets() → writes to SQLite, not Base44
//   - All mutations → SQLite first, Base44 sync in background

const PRESET_DEFAULTS = [
  { name: 'Engine Oil Change',        emoji: '🛢️', intervalKm: 3000,  intervalDays: 90  },
  { name: 'Gear Oil / Transmission',  emoji: '⚙️', intervalKm: 5000,  intervalDays: 180 },
  { name: 'Brake Pads / Brake Shoes', emoji: '🛑', intervalKm: 10000, intervalDays: 365 },
  { name: 'Tire Check & Rotation',    emoji: '🔵', intervalKm: 5000,  intervalDays: 180 },
  { name: 'Air Filter',               emoji: '💨', intervalKm: 10000, intervalDays: 365 },
  { name: 'Spark Plugs',              emoji: '⚡', intervalKm: 15000, intervalDays: 730 },
  { name: 'Battery Check',            emoji: '🔋', intervalKm: 20000, intervalDays: 365 },
  { name: 'Coolant / Radiator',       emoji: '❄️', intervalKm: 20000, intervalDays: 730 },
  { name: 'Chain & Sprocket',         emoji: '🔗', intervalKm: 8000,  intervalDays: 180 },
  { name: 'Wiper Blades',             emoji: '🪟', intervalKm: 15000, intervalDays: 365 },
];

const EMPTY_FORM = {
  current_odo: '',
  service_date: '',
  next_service_date: '',
  notification_time: '08:00',
  notes: '',
  reminders_enabled: true,
};

// ─── Odometer helpers (Preferences) ──────────────────────────────────────────
const getOdoKey = (email) => `routenet_odo_${email}`;
const getHistoryKey = (email) => `routenet_maint_history_${email}`;

async function loadOdometer(email) {
  try {
    const { value } = await Preferences.get({ key: getOdoKey(email) });
    return value ? Number(value) : 0;
  } catch { return 0; }
}

async function saveOdometer(email, km) {
  try {
    await Preferences.set({ key: getOdoKey(email), value: String(km) });
  } catch {}
}

async function loadHistory(email) {
  try {
    const { value } = await Preferences.get({ key: getHistoryKey(email) });
    return value ? JSON.parse(value) : [];
  } catch { return []; }
}

async function appendHistory(email, entry) {
  try {
    const history = await loadHistory(email);
    history.unshift({ ...entry, recorded_at: new Date().toISOString() });
    // Keep last 200 records
    const trimmed = history.slice(0, 200);
    await Preferences.set({ key: getHistoryKey(email), value: JSON.stringify(trimmed) });
  } catch {}
}

export default function VehicleMaintenance() {
  const navigate = useNavigate();
  const { theme, user } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const createdBy = user?.email || null;

  const [isResetting, setIsResetting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const formRef = useRef(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const updateForm = (updater) => {
    setForm(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      formRef.current = next;
      return next;
    });
  };

  // FIX: Read maintenance items from SQLite (local-first)
  const { data: maintenanceItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['customMaintenance'],
    queryFn: async () => {
      if (isOnline) {
        syncMaintenance(createdBy).catch(e => console.warn('[VehicleMaintenance] sync:', e));
      }
      return getLocalMaintenance(createdBy);
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // FIX: Read service history from Preferences (device-local)
  const { data: historyItems = [], refetch: refetchHistory } = useQuery({
    queryKey: ['maintenanceHistory'],
    queryFn: () => createdBy ? loadHistory(createdBy) : [],
  });

  // FIX: Read odometer from Preferences (device-local)
  const { data: currentOdo = 0 } = useQuery({
    queryKey: ['maintenanceOdo'],
    queryFn: () => createdBy ? loadOdometer(createdBy) : 0,
  });

  // FIX: Show ALL maintenance items not just presets.
  // Previously only is_preset=1 items showed — custom items were silently excluded.
  // FIX: Show ALL maintenance items not just presets.
  // Previously only is_preset=1 items showed — custom items were silently excluded.
  const presetItems = useMemo(() => (maintenanceItems || []).filter(i => i?.is_preset), [maintenanceItems]);
  const allItems = useMemo(() => [...(maintenanceItems || [])], [maintenanceItems]);

  const computedItems = useMemo(() => {
    return allItems.map(item => {
      let daysLeft = null;
      let status = 'none';
      if (item.next_service_date) {
        const today = startOfDay(new Date());
        const nextDate = startOfDay(new Date(item.next_service_date.includes('T') ? item.next_service_date : item.next_service_date + 'T00:00:00'));
        daysLeft = differenceInCalendarDays(nextDate, today);
        if (daysLeft < 0) status = 'overdue';
        else if (daysLeft <= 7) status = 'soon';
        else status = 'safe';
      }
      const history = (historyItems || [])
        .filter(h => h.item_name === item.name)
        .sort((a, b) => new Date(b.serviced_date) - new Date(a.serviced_date));
      return { ...item, daysLeft, status, history };
    });
  }, [allItems, historyItems]);

  const sortedItems = [...computedItems].sort((a, b) => {
    const p = { overdue: 0, soon: 1, safe: 2, none: 3 };
    return p[a.status] - p[b.status];
  });

  const formatDate = (dateStr) => {
    try { return format(new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00'), 'MMM d, yyyy'); }
    catch { return dateStr; }
  };

  const getDaysLabel = (daysLeft) => {
    if (daysLeft === null) return null;
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Today';
    if (daysLeft === 1) return 'Tomorrow';
    return `${daysLeft} days`;
  };

  const urgencyTextColor = (status) => {
    if (status === 'overdue') return 'text-red-500';
    if (status === 'soon') return 'text-orange-500';
    return isDark ? 'text-white' : 'text-gray-900';
  };

  // FIX: seedPresets writes to SQLite (local-first) not Base44 directly
  const seedPresets = async () => {
    const now = new Date().toISOString();
    await Promise.all(
      PRESET_DEFAULTS.map(p =>
        createLocalMaintenance({
          id: `maint_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${p.name.replace(/\s+/g, '_').toLowerCase()}`,
          remote_id: null,
          name: p.name,
          emoji: p.emoji,
          is_preset: 1,
          last_odo_km: 0,
          max_odo_interval_km: p.intervalKm,
          reminders_enabled: 1,
          last_service_date: null,
          next_service_date: null,
          next_odo_km: null,
          notification_time: '08:00',
          is_active: 1,
          created_by: createdBy,
          created_at: now,
          updated_at: now,
          sync_status: 'pending',
        }).catch(() => {})
      )
    );
  };

  const resetPresets = async () => {
    setIsResetting(true);
    try {
      toast.loading('Setting up maintenance items...');

      // Delete existing local records
      const existing = await getLocalMaintenance(createdBy);
      await Promise.all(existing.map(i => deleteLocalMaintenance(i.id).catch(() => {})));

      // Seed fresh presets to SQLite
      await seedPresets();

      // Sync to Base44 in background if online
      if (isOnline) {
        syncMaintenance(createdBy).catch(e => console.warn('[VehicleMaintenance] seed sync:', e));
      }

      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ['customMaintenance'] });
      toast.dismiss();
      toast.success('Maintenance items ready! ✅');
    } catch (e) {
      console.error('[VehicleMaintenance] reset failed:', e);
      toast.dismiss();
      toast.error('Setup failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const openItem = (item) => {
    const newForm = {
      current_odo: currentOdo > 0 ? String(currentOdo) : '',
      service_date: item.last_service_date || '',
      next_service_date: item.next_service_date || '',
      notification_time: item.notification_time || '08:00',
      notes: '',
      reminders_enabled: item.reminders_enabled !== false && item.reminders_enabled !== 0,
    };
    formRef.current = newForm;
    setForm(newForm);
    setFormErrors({});
    setSelectedItem(item);
  };

  const closeForm = () => {
    formRef.current = EMPTY_FORM;
    setSelectedItem(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  // FIX: saveScheduleMutation writes to SQLite first, schedules local notification
  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const f = formRef.current;
      const errors = {};
      if (!f.next_service_date) errors.next_service_date = 'Please select next service date.';
      if (Object.keys(errors).length > 0) { setFormErrors(errors); throw new Error('validation'); }

      const odo = Number(String(f.current_odo).replace(/[^\d.]/g, '')) || 0;

      // FIX: Save odometer to Preferences (device-local, works offline)
      if (odo > 0 && createdBy) {
        await saveOdometer(createdBy, odo);
        queryClient.invalidateQueries({ queryKey: ['maintenanceOdo'] });
      }

      const preset = PRESET_DEFAULTS.find(p => p.name === selectedItem.name);
      const nextKm = preset && odo > 0 ? odo + preset.intervalKm : selectedItem.next_odo_km || null;

      // FIX: Write to SQLite immediately — works offline and online
      await updateLocalMaintenance(selectedItem.id, {
        next_service_date: f.next_service_date,
        next_odo_km: nextKm,
        notification_time: f.notification_time,
        reminders_enabled: f.reminders_enabled ? 1 : 0,
        last_service_date: f.service_date || selectedItem.last_service_date || null,
        last_odo_km: odo > 0 ? odo : selectedItem.last_odo_km || 0,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });

      return { snapItem: { ...selectedItem }, snapForm: { ...f }, nextKm };
    },
    onSuccess: async ({ snapItem, snapForm }) => {
      closeForm();
      toast.success('Schedule saved! ✅');

      // FIX: Schedule local notification immediately — works offline
      if (snapForm.reminders_enabled && snapForm.next_service_date) {
        await scheduleMaintenanceNotification({
          id: snapItem.id,
          title: snapItem.name,
          next_service_date: snapForm.next_service_date,
          notification_time: snapForm.notification_time,
          is_active: true,
        });
      } else {
        await cancelReminderNotification(snapItem.id);
      }

      // Sync to Base44 in background if online
      if (isOnline && createdBy) {
        syncMaintenance(createdBy).catch(e => console.warn('[VehicleMaintenance] save sync:', e));
      }

      refetchItems();
      queryClient.invalidateQueries({ queryKey: ['customMaintenance'] });
    },
    onError: (e) => { if (e.message !== 'validation') toast.error('Failed to save.'); },
  });

  // FIX: markDoneMutation writes to SQLite + Preferences, schedules local notification
  const markDoneMutation = useMutation({
    mutationFn: async () => {
      const f = formRef.current;
      const today = new Date().toISOString().slice(0, 10);
      const odo = Number(String(f.current_odo).replace(/[^\d.]/g, '')) || 0;
      const preset = PRESET_DEFAULTS.find(p => p.name === selectedItem.name);

      // FIX: Append service to Preferences history (device-local, works offline)
      await appendHistory(createdBy, {
        item_name: selectedItem.name,
        item_emoji: selectedItem.emoji || preset?.emoji || '🔧',
        serviced_date: f.service_date || today,
        odometer_km: odo,
        notes: f.notes || '',
      });

      // FIX: Save odometer to Preferences
      if (odo > 0 && createdBy) {
        await saveOdometer(createdBy, odo);
      }

      const nextDate = preset
        ? new Date(Date.now() + preset.intervalDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : f.next_service_date || null;
      const nextKm = preset && odo > 0 ? odo + preset.intervalKm : selectedItem.next_odo_km || null;

      // FIX: Write to SQLite immediately
      await updateLocalMaintenance(selectedItem.id, {
        last_service_date: f.service_date || today,
        last_odo_km: odo > 0 ? odo : selectedItem.last_odo_km || 0,
        next_service_date: nextDate,
        next_odo_km: nextKm,
        notification_time: f.notification_time,
        reminders_enabled: f.reminders_enabled ? 1 : 0,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });

      return { snapItem: { ...selectedItem }, snapForm: { ...f }, nextDate };
    },
    onSuccess: async ({ snapItem, snapForm, nextDate }) => {
      closeForm();
      toast.success('Service recorded! ✅');

      // FIX: Reschedule local notification for next service date
      if (snapForm.reminders_enabled && nextDate) {
        await scheduleMaintenanceNotification({
          id: snapItem.id,
          title: snapItem.name,
          next_service_date: nextDate,
          notification_time: snapForm.notification_time,
          is_active: true,
        });
      }

      // Sync to Base44 in background if online
      if (isOnline && createdBy) {
        syncMaintenance(createdBy).catch(e => console.warn('[VehicleMaintenance] done sync:', e));
      }

      refetchItems();
      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ['customMaintenance', 'maintenanceHistory', 'maintenanceOdo'] });
    },
    onError: () => toast.error('Failed to record service.'),
  });

  // FIX: toggleBellMutation writes to SQLite, schedules/cancels local notification
  const toggleBellMutation = useMutation({
    mutationFn: async ({ item, enabled }) => {
      await updateLocalMaintenance(item.id, {
        reminders_enabled: enabled ? 1 : 0,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });

      if (enabled && item.next_service_date) {
        await scheduleMaintenanceNotification({
          id: item.id,
          title: item.name,
          next_service_date: item.next_service_date,
          notification_time: item.notification_time || '08:00',
          is_active: true,
        });
      } else {
        await cancelReminderNotification(item.id);
      }

      if (isOnline && createdBy) {
        syncMaintenance(createdBy).catch(e => console.warn('[VehicleMaintenance] toggle sync:', e));
      }
    },
    onSuccess: async () => {
      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ['customMaintenance'] });
    },
  });

  // FIX: deleteItemMutation clears SQLite record, cancels local notification
  const deleteItemMutation = useMutation({
    mutationFn: async (item) => {
      // Cancel OS notification
      await cancelReminderNotification(item.id);

      // Clear schedule fields in SQLite (keep the preset, just clear dates)
      await updateLocalMaintenance(item.id, {
        next_service_date: null,
        last_service_date: null,
        last_odo_km: 0,
        next_odo_km: null,
        reminders_enabled: 0,
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
      });

      if (isOnline && createdBy) {
        syncMaintenance(createdBy).catch(e => console.warn('[VehicleMaintenance] delete sync:', e));
      }
    },
    onSuccess: async () => {
      await refetchItems();
      queryClient.invalidateQueries({ queryKey: ['customMaintenance'] });
      toast.success('Schedule cleared.');
    },
    onError: () => toast.error('Failed to clear schedule.'),
  });

  const disabled = itemsLoading;
  const isBusy = saveScheduleMutation.isPending || markDoneMutation.isPending;

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]' : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'} overflow-x-hidden`}>
      <div className="max-w-screen-lg mx-auto px-3">

        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Vehicle Maintenance</h1>
          </div>
          <button
            onClick={resetPresets}
            disabled={isResetting || disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isDark ? 'border-[#66BB6A]/30 text-[#66BB6A] hover:bg-[#66BB6A]/10' : 'border-gray-300 text-gray-500 hover:bg-gray-100'} disabled:opacity-50`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isResetting ? 'Resetting...' : 'Reset'}</span>
          </button>
        </div>

        {computedItems.length === 0 ? (
          <div className={`p-8 rounded-3xl text-center mt-4 ${isDark ? 'card-dark' : 'bg-white/70 border border-gray-200'}`}>
            <Wrench className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-[#66BB6A]/30' : 'text-gray-300'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Maintenance Items Yet</h3>
            <p className={`text-sm mb-5 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Set up your 10 maintenance items to get started</p>
            <button onClick={resetPresets} disabled={isResetting || disabled} className="bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black font-semibold px-6 py-3 rounded-full text-sm hover:opacity-90 disabled:opacity-50">
              {isResetting ? 'Setting up...' : '✨ Set Up Maintenance Items'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {sortedItems.map(item => {
                const preset = PRESET_DEFAULTS.find(p => p.name === item.name);
                return (
                  <button key={item.id} onClick={() => openItem(item)} className={`p-3 rounded-xl shadow-sm transition-all min-h-[88px] flex flex-col items-center justify-center ${isDark ? 'card-dark hover:shadow-md' : 'bg-white/70 border border-gray-200'}`}>
                    <span className="text-2xl mb-1.5">{item.emoji || preset?.emoji || '🔧'}</span>
                    <p className={`text-[12px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-center leading-tight line-clamp-2`}>{item.name}</p>
                    {item.next_service_date ? (
                      <p className={`text-[10px] mt-0.5 font-medium ${urgencyTextColor(item.status)}`}>{getDaysLabel(item.daysLeft)}</p>
                    ) : (
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Tap to schedule</p>
                    )}
                  </button>
                );
              })}
            </div>

            {sortedItems.filter(i => i.next_service_date).length > 0 && (
              <div>
                <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Reminders</h2>
                <div className="space-y-3">
                  {sortedItems.filter(i => i.next_service_date).map(item => {
                    const preset = PRESET_DEFAULTS.find(p => p.name === item.name);
                    const reminderOn = item.reminders_enabled !== false && item.reminders_enabled !== 0;
                    return (
                      <Card key={item.id} className={`p-4 rounded-3xl ${isDark ? 'card-dark border-white/5' : 'bg-white/70 border border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <button className="flex items-start gap-3 flex-1 text-left" onClick={() => openItem(item)}>
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#66BB6A]/10 border border-[#66BB6A]/20' : 'bg-gray-100'}`}>
                              <span className="text-lg">{item.emoji || preset?.emoji || '🔧'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</h3>
                              {item.last_service_date && (
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                  Last: {formatDate(item.last_service_date)}{item.last_odo_km > 0 ? ` · ${item.last_odo_km.toLocaleString()} KM` : ''}
                                </p>
                              )}
                              <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Next: {formatDate(item.next_service_date)}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className={`text-sm font-medium ${urgencyTextColor(item.status)}`}>{getDaysLabel(item.daysLeft)}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reminderOn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {reminderOn ? 'Active Reminder' : 'Reminder Off'}
                                </span>
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button onClick={() => toggleBellMutation.mutate({ item, enabled: !reminderOn })} className={`p-2 rounded-lg transition-colors ${reminderOn ? 'text-[#66BB6A]' : isDark ? 'text-white/40' : 'text-gray-400'}`}>
                              {reminderOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => openItem(item)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteItemMutation.mutate(item)} className="p-2 rounded-lg transition-colors text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {item.history.length > 0 && (
                          <div className={`mt-3 pt-3 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Service History</p>
                            {item.history.slice(0, 5).map((h, idx) => (
                              <div key={idx} className="flex justify-between items-start">
                                <div>
                                  <p className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{formatDate(h.serviced_date)}</p>
                                  {h.notes && <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{h.notes}</p>}
                                </div>
                                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{h.odometer_km > 0 ? `${h.odometer_km.toLocaleString()} KM` : '—'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedItem && (
        <ModalContainer open={!!selectedItem} onClose={closeForm} isDark={isDark} title={`${selectedItem.emoji || ''} ${selectedItem.name}`} headerRight={<GreenCloseButton onClick={closeForm} />}>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Current Odometer (KM) <span className={`font-normal ${isDark ? 'text-white/40' : 'text-gray-400'}`}>(optional)</span></Label>
              <Input value={form.current_odo} onChange={e => updateForm(f => ({ ...f, current_odo: e.target.value }))} placeholder="e.g. 24500" inputMode="numeric" className={isDark ? 'bg-white/10 text-white border-white/20' : ''} />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Service Date <span className={`font-normal ${isDark ? 'text-white/40' : 'text-gray-400'}`}>(last serviced)</span></Label>
              <DatePicker value={form.service_date} onChange={val => updateForm(f => ({ ...f, service_date: val }))} placeholder="Select service date" />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Next Service Date <span className="text-red-500">*</span></Label>
              <DatePicker value={form.next_service_date} onChange={val => { updateForm(f => ({ ...f, next_service_date: val })); setFormErrors(e => ({ ...e, next_service_date: '' })); }} placeholder="Select next service date" error={!!formErrors.next_service_date} />
              {formErrors.next_service_date && <p className="text-red-500 text-xs mt-1">{formErrors.next_service_date}</p>}
            </div>

            <div>
              <Label className="mb-1 block text-xs">Notify me at <span className="text-red-500">*</span></Label>
              <TimePickerInput value={form.notification_time} onChange={time => updateForm(f => ({ ...f, notification_time: time }))} isDark={isDark} />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Notes <span className={`font-normal ${isDark ? 'text-white/40' : 'text-gray-400'}`}>(optional)</span></Label>
              <Input value={form.notes} onChange={e => updateForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Valvoline full synthetic" className={isDark ? 'bg-white/10 text-white border-white/20' : ''} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Enable Reminders</Label>
              <Switch checked={form.reminders_enabled} onCheckedChange={val => updateForm(f => ({ ...f, reminders_enabled: val }))} className="premium-switch" />
            </div>

            {!isOnline && (
              <p className="text-xs text-yellow-500 text-center">
                📵 Offline — changes save locally and sync when reconnected.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={closeForm} disabled={isBusy} className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}>Cancel</Button>
              <Button onClick={() => saveScheduleMutation.mutate()} disabled={isBusy} className={`flex-1 ${isDark ? 'btn-secondary' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'}`}>
                {saveScheduleMutation.isPending ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>

            <Button onClick={() => markDoneMutation.mutate()} disabled={isBusy} className="w-full bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black font-semibold hover:opacity-90">
              {markDoneMutation.isPending ? 'Recording...' : '✅ Mark as Done'}
            </Button>
          </div>
        </ModalContainer>
      )}
    </div>
  );
}
