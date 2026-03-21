import React, { useState, useMemo } from 'react';
import { FileText, Shield, Clipboard, Wind, Plus, Edit2, Trash2, Bell, BellOff, Wrench, CreditCard, Lock } from 'lucide-react';
import GreenCloseButton from '../components/ui/GreenCloseButton';
import ModalContainer from '../components/ui/ModalContainer';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import DatePicker from '../components/ui/DatePicker';
import TimePickerInput from '../components/ui/TimePickerInput';
import { usePremiumGate } from '../components/premium/usePremiumGate';
import LockedOverlay from '../components/premium/LockedOverlay';
import PremiumPaywallSheet from '../components/premium/PremiumPaywallSheet';
import { useNavigate } from 'react-router-dom';
import {
  createLocalRenewal,
  updateLocalRenewal,
  deleteLocalRenewal,
  getLocalRenewals,
  getLocalMaintenance,
} from '@/database/genericRepository';
import { syncRenewalReminders, syncMaintenance } from '@/services/syncService';
import {
  scheduleRenewalNotification,
  cancelReminderNotification,
} from '@/services/reminderEngine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';

export default function Utilities() {
  const navigate = useNavigate();
  const { t, theme, user, isPremium, isTrialActive } = useApp();
  const { isOnline } = useOffline();
  const { checkPremiumAccess, paywallOpen, paywallContext, closePaywall } = usePremiumGate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    reminder_type: '',
    custom_name: '',
    date_issued: '',
    renewal_date: '',
    notification_time: '08:00',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);

  const isDark = theme === 'dark';

  // FIX: Removed triggerRefetch with setTimeout — SQLite is already updated
  // when mutations complete, so direct refetch() works immediately.

  const { data: reminders = [], refetch } = useQuery({
    queryKey: ['renewalReminders'],
    queryFn: async () => {
      
      // Read from SQLite — local-first. Sync first if online.
      if (isOnline) {
        syncRenewalReminders(user?.email).catch(e => console.warn('[Utilities] sync:', e));
      }
      return getLocalRenewals();
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // FIX: MaintenanceTracker and CustomMaintenance were reading directly from
  // Base44 with no SQLite fallback — data was empty offline. Now reads from
  // SQLite (local-first) and only syncs from Base44 if online.
  const { data: maintenanceItems = [] } = useQuery({
    queryKey: ['customMaintenance'],
    queryFn: async () => {
      
      if (isOnline) {
        syncMaintenance(user?.email).catch(e => console.warn('[Utilities] maintenance sync:', e));
      }
      return getLocalMaintenance();
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // MaintenanceTracker summary still reads from Base44 for the odometer widget
  // since tracker data is not yet in the local maintenance table schema.
  // This is non-critical — it only affects the PMS summary card, not reminders.
  const { data: trackers = [] } = useQuery({
    queryKey: ['maintenanceTrackers'],
    queryFn: () => base44.entities.MaintenanceTracker.filter({ created_by: user?.email }),
    enabled: isOnline && !!user?.email,
  });

  const tracker = trackers[0] || null;

  const pmsSummary = useMemo(() => {
    if (!tracker || maintenanceItems.length === 0) return null;
    const currentOdo = tracker.current_odo_km || tracker.current_odometer || 0;
    let minRemaining = Infinity;
    let minStatus = 'safe';
    maintenanceItems.forEach(item => {
      if (!item.is_preset) return;
      const lastOdo = item.last_odo_km || 0;
      const maxInterval = item.max_odo_interval_km || 0;
      const nextPms = lastOdo + maxInterval;
      const remaining = nextPms - currentOdo;
      if (remaining < minRemaining) {
        minRemaining = remaining;
        if (remaining <= 0) minStatus = 'overdue';
        else if (remaining <= 1000) minStatus = 'soon';
        else minStatus = 'safe';
      }
    });
    if (minRemaining === Infinity) return null;
    return { nextPms: Math.round(currentOdo + minRemaining), remaining: Math.round(minRemaining), status: minStatus };
  }, [tracker, maintenanceItems]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Write to SQLite first — instant, works offline and online
      const saved = await createLocalRenewal({
        ...data,
        created_by: user?.email,
      });

      // FIX: Schedule local notification immediately after SQLite write.
      // Old code called base44.functions.invoke('scheduleRenewalPush') which
      // only works online and requires the record to exist in Base44 first.
      // scheduleRenewalNotification() uses @capacitor/local-notifications —
      // fires on-device even when offline and app is closed.
      await scheduleRenewalNotification({
        id: saved.id,
        reminder_type: data.reminder_type,
        custom_name: data.custom_name,
        renewal_date: data.renewal_date,
        notification_time: data.notification_time,
        is_active: data.is_active,
      });

      // Push to Base44 in background if online — non-blocking
      if (isOnline && user?.email) {
        syncRenewalReminders(user?.email).catch(e =>
          console.warn('[Utilities] create sync failed (non-fatal):', e)
        );
      }

      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewalReminders'] });
      toast.success(t('REMINDER_SAVED'));
      // FIX: Direct refetch — no setTimeout needed
      refetch();
      resetForm();
    },
    onError: () => toast.error('Failed to save reminder.')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Write to SQLite first
      await updateLocalRenewal(id, data);

      // FIX: Reschedule local notification after update
      await scheduleRenewalNotification({
        id,
        reminder_type: data.reminder_type,
        custom_name: data.custom_name,
        renewal_date: data.renewal_date,
        notification_time: data.notification_time,
        is_active: data.is_active,
      });

      if (isOnline && user?.email) {
        syncRenewalReminders(user?.email).catch(e =>
          console.warn('[Utilities] update sync failed (non-fatal):', e)
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewalReminders'] });
      toast.success(t('REMINDER_UPDATED'));
      // FIX: Direct refetch — no setTimeout
      refetch();
      resetForm();
    },
    onError: () => toast.error('Failed to update reminder.')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const reminder = reminders.find(r => r.id === id);

      // Delete from SQLite immediately — works offline and online
      await deleteLocalRenewal(id);

      // FIX: Cancel the local notification when reminder is deleted
      await cancelReminderNotification(id);

      // Also delete from Base44 if online and has remote record
      if (isOnline && reminder?.remote_id) {
        base44.entities.RenewalReminder.delete(reminder.remote_id)
          .catch(e => console.warn('[Utilities] remote delete failed (non-fatal):', e));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewalReminders'] });
      toast.success(t('REMINDER_DELETED'));
      // FIX: Direct refetch — no setTimeout
      refetch();
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active, reminder }) => {
      // Write to SQLite first
      await updateLocalRenewal(id, { ...reminder, is_active });

      // FIX: Schedule or cancel local notification based on active state
      if (is_active) {
        await scheduleRenewalNotification({
          id,
          reminder_type: reminder.reminder_type,
          custom_name: reminder.custom_name,
          renewal_date: reminder.renewal_date,
          notification_time: reminder.notification_time,
          is_active: true,
        });
      } else {
        await cancelReminderNotification(id);
      }

      if (isOnline && user?.email) {
        syncRenewalReminders(user?.email).catch(e =>
          console.warn('[Utilities] toggle sync failed (non-fatal):', e)
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewalReminders'] });
      toast.success(t('REMINDER_STATUS_UPDATED'));
      // FIX: Direct refetch — no setTimeout
      refetch();
    }
  });

  const getReminderTypeName = (type) => {
    const names = {
      insurance: t('INSURANCE'),
      registration: t('REGISTRATION'),
      emission_test: t('EMISSION_TEST'),
      license: t('DRIVERS_LICENSE'),
      maintenance: t('MAINTENANCE'),
      custom: 'Custom'
    };
    return names[type] || type;
  };

  const getReminderIcon = (type) => {
    const icons = { insurance: Shield, registration: Clipboard, emission_test: Wind, license: CreditCard, custom: Plus, maintenance: Wrench };
    return icons[type] || FileText;
  };

  const handleSave = () => {
    const newErrors = {};
    if (!formData.reminder_type) newErrors.reminder_type = 'Please select a reminder type.';
    if (!formData.date_issued) newErrors.date_issued = t('ERROR_DATE_ISSUED');
    if (!formData.renewal_date) newErrors.renewal_date = t('ERROR_RENEWAL_DATE');
    if ((formData.reminder_type === 'custom' || formData.reminder_type === 'maintenance') && !formData.custom_name.trim()) {
      newErrors.custom_name = t('ERROR_CUSTOM_NAME');
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});

    const normalizedData = {
      ...formData,
      date_issued: formData.date_issued ? new Date(formData.date_issued).toISOString().slice(0, 10) : '',
      renewal_date: formData.renewal_date ? new Date(formData.renewal_date).toISOString().slice(0, 10) : ''
    };

    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data: normalizedData });
    } else {
      createMutation.mutate(normalizedData);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      reminder_type: reminder.reminder_type,
      custom_name: reminder.custom_name || '',
      date_issued: reminder.date_issued || '',
      renewal_date: reminder.renewal_date,
      notification_time: reminder.notification_time || '08:00',
      is_active: reminder.is_active
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleDelete = (reminder) => {
    setReminderToDelete(reminder);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (reminderToDelete?.id) {
      deleteMutation.mutate(reminderToDelete.id);
      setDeleteConfirmOpen(false);
      setReminderToDelete(null);
    }
  };

  const handleToggleActive = (reminder) => {
    toggleActiveMutation.mutate({ id: reminder.id, is_active: !reminder.is_active, reminder });
  };

  const resetForm = () => {
    setFormData({ reminder_type: '', custom_name: '', date_issued: '', renewal_date: '', notification_time: '08:00', is_active: true });
    setErrors({});
    setEditingReminder(null);
    setDialogOpen(false);
  };

  const handleRenewalClick = (item) => {
    if (isFree) { checkPremiumAccess('Renewals & Reminders'); return; }
    const existing = reminders.find(r => r.reminder_type === item.type);
    if (existing) {
      handleEdit(existing);
    } else {
      setFormData({ reminder_type: item.type, custom_name: '', date_issued: '', renewal_date: '', notification_time: '08:00', is_active: true });
      setEditingReminder(null);
      setErrors({});
      setDialogOpen(true);
    }
  };

  const getDaysUntil = (date) => {
    const dateStr = date.includes('T') ? date : date + 'T00:00:00';
    const renewalDate = startOfDay(new Date(dateStr));
    const today = startOfDay(new Date());
    const days = differenceInCalendarDays(renewalDate, today);
    if (days < 0) return t('OVERDUE');
    if (days === 0) return t('TODAY');
    if (days === 1) return t('TOMORROW');
    return t('DAYS_REMAINING').replace('{days}', days);
  };

  const getUrgencyColor = (date) => {
    const dateStr = date.includes('T') ? date : date + 'T00:00:00';
    const renewalDate = startOfDay(new Date(dateStr));
    const today = startOfDay(new Date());
    const days = differenceInCalendarDays(renewalDate, today);
    if (days < 0) return 'text-red-600';
    if (days <= 7) return 'text-orange-600';
    if (days <= 30) return 'text-yellow-600';
    return isDark ? 'text-white' : 'text-gray-900';
  };

  const defaultReminderTypes = [
    { type: 'insurance', name: t('INSURANCE_RENEWAL'), icon: Shield },
    { type: 'registration', name: t('REGISTRATION_RENEWAL'), icon: Clipboard },
    { type: 'emission_test', name: t('EMISSION_TEST'), icon: Wind },
    { type: 'license', name: t('DRIVERS_LICENSE_RENEWAL'), icon: CreditCard }
  ];

  const reminderTypeOptions = [
    { value: 'insurance', label: t('INSURANCE_RENEWAL') },
    { value: 'registration', label: t('REGISTRATION_RENEWAL') },
    { value: 'emission_test', label: t('EMISSION_TEST') },
    { value: 'license', label: t('DRIVERS_LICENSE_RENEWAL') },
    { value: 'maintenance', label: t('MAINTENANCE') },
    { value: 'custom', label: 'Custom' }
  ];

  const activeReminders = reminders.filter(r => r.is_active);
  const inactiveReminders = reminders.filter(r => !r.is_active);
  const isFree = !isPremium() && !isTrialActive();
  const needsCustomName = formData.reminder_type === 'custom' || formData.reminder_type === 'maintenance';

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]' : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'} overflow-x-hidden`}>
      <div className="max-w-screen-lg mx-auto px-3">
        <div className="py-4">
          <div className="flex items-center justify-between">
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('RENEWALS_AND_MAINTENANCE')}</h1>
            <button
              onClick={() => {
                if (isFree) {
                  checkPremiumAccess('Renewals & Reminders');
                } else {
                  setFormData({ reminder_type: 'custom', custom_name: '', date_issued: '', renewal_date: '', notification_time: '08:00', is_active: true });
                  setEditingReminder(null);
                  setErrors({});
                  setDialogOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all shadow-sm ${isFree ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] hover:shadow-md'} text-black`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('ADD')}</span>
              {isFree && <Lock className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className={`space-y-3 relative ${isFree ? 'min-h-[400px]' : ''}`}>
          {isFree && (
            <LockedOverlay title="Premium Feature" subtitle="Renewals & Reminders" onClick={() => checkPremiumAccess('Renewals & Reminders')} className="rounded-none" />
          )}

          <button
            onClick={() => navigate(createPageUrl('VehicleMaintenance'))}
            className={`w-full p-3 rounded-xl shadow-sm transition-all flex items-center gap-3 ${isDark ? 'card-dark hover:shadow-md' : 'bg-white/70 border border-gray-200'}`}
          >
            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#66BB6A]/10 border border-[#66BB6A]/20' : 'bg-gray-100'}`}>
              <Wrench className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h3 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{t('VEHICLE_MAINTENANCE')}</h3>
              <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('TRACK_MAINTENANCE')}</p>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {defaultReminderTypes.map((item) => {
              const Icon = item.icon;
              const existing = reminders.find(r => r.reminder_type === item.type);
              const isLocked = !isPremium();
              return (
                <button
                  key={item.type}
                  onClick={() => handleRenewalClick(item)}
                  className={`p-3 rounded-xl shadow-sm transition-all relative min-h-[88px] flex flex-col items-center justify-center ${isDark ? 'card-dark hover:shadow-md' : 'bg-white/70 border border-gray-200'} ${isLocked ? 'opacity-60' : ''}`}
                >
                  {isLocked && <div className="absolute top-1.5 right-1.5"><Lock className="w-3.5 h-3.5 text-yellow-500" /></div>}
                  <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
                  <p className={`text-[12px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-center whitespace-normal break-words leading-tight line-clamp-2`}>{item.name}</p>
                  {existing && (
                    <>
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isDark ? 'bg-[#66BB6A]' : 'bg-[#0B3D2E]'}`} />
                      <p className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-[#66BB6A]' : 'text-[#0B3D2E]'}`}>
                        {format(new Date(existing.renewal_date.includes('T') ? existing.renewal_date : existing.renewal_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </p>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {activeReminders.length > 0 && (
            <div>
              <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('ACTIVE_REMINDERS')}</h2>
              <div className="space-y-3">
                {activeReminders.map((reminder) => {
                  const Icon = getReminderIcon(reminder.reminder_type);
                  const reminderName = reminder.reminder_type === 'custom' || reminder.reminder_type === 'maintenance'
                    ? reminder.custom_name
                    : getReminderTypeName(reminder.reminder_type);
                  return (
                    <Card key={reminder.id} className={`p-4 rounded-3xl ${isDark ? 'card-dark border-white/5' : 'bg-white/70 border border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-[#66BB6A]/10 border border-[#66BB6A]/20' : 'bg-gray-100'}`}>
                            <Icon className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{reminderName}</h3>
                            {reminder.date_issued && (
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                {t('ISSUED_PREFIX')}: {format(new Date(reminder.date_issued.includes('T') ? reminder.date_issued : reminder.date_issued + 'T00:00:00'), 'MMM d, yyyy')}
                              </p>
                            )}
                            <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              {t('RENEWAL_PREFIX')}: {format(new Date(reminder.renewal_date.includes('T') ? reminder.renewal_date : reminder.renewal_date + 'T00:00:00'), 'MMMM d, yyyy')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-sm font-medium ${getUrgencyColor(reminder.renewal_date)}`}>{getDaysUntil(reminder.renewal_date)}</p>
                              {reminder.is_active && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{t('ACTIVE_REMINDER_BADGE')}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleActive(reminder)} className={`p-2 rounded-lg transition-colors ${reminder.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                            {reminder.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleEdit(reminder)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                            <Edit2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-600'}`} />
                          </button>
                          <button onClick={() => handleDelete(reminder)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {inactiveReminders.length > 0 && (
            <div>
              <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('INACTIVE_REMINDERS')}</h2>
              <div className="space-y-3">
                {inactiveReminders.map((reminder) => {
                  const Icon = getReminderIcon(reminder.reminder_type);
                  const reminderName = reminder.reminder_type === 'custom' || reminder.reminder_type === 'maintenance'
                    ? reminder.custom_name
                    : getReminderTypeName(reminder.reminder_type);
                  return (
                    <Card key={reminder.id} className={`p-4 opacity-60 rounded-3xl ${isDark ? 'card-dark border-white/5' : 'bg-white/70 border border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-[#66BB6A]/10 border border-[#66BB6A]/20' : 'bg-gray-100'}`}>
                            <Icon className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{reminderName}</h3>
                            {reminder.date_issued && (
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                Issued: {format(new Date(reminder.date_issued.includes('T') ? reminder.date_issued : reminder.date_issued + 'T00:00:00'), 'MMM d, yyyy')}
                              </p>
                            )}
                            <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              Renewal: {format(new Date(reminder.renewal_date.includes('T') ? reminder.renewal_date : reminder.renewal_date + 'T00:00:00'), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleActive(reminder)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50">
                            <BellOff className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(reminder)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                            <Edit2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-600'}`} />
                          </button>
                          <button onClick={() => handleDelete(reminder)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {reminders.length === 0 && (
            <div className={`text-center py-12 rounded-3xl ${isDark ? 'card-dark' : 'bg-white/70 border border-gray-200'}`}>
              <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-[#66BB6A]/40' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('NO_REMINDERS_YET')}</h3>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Add your first {t('ADD_FIRST_REMINDER')} to get started</p>
            </div>
          )}
        </div>

        <ModalContainer
          open={dialogOpen}
          onClose={() => resetForm()}
          isDark={isDark}
          title={editingReminder ? t('EDIT_REMINDER') : t('ADD_REMINDER')}
          headerRight={<GreenCloseButton onClick={resetForm} />}
        >
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Reminder Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.reminder_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, reminder_type: value, custom_name: '' });
                  setErrors(prev => ({ ...prev, reminder_type: '' }));
                }}
              >
                <SelectTrigger className={`${isDark ? 'dark-select-trigger' : ''} ${errors.reminder_type ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className={isDark ? 'dark-select-content' : 'light-select-content'}>
                  {reminderTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reminder_type && <p className="text-red-500 text-xs mt-1">{errors.reminder_type}</p>}
            </div>

            {needsCustomName && (
              <div>
                <Label className="mb-2 block">{t('CUSTOM_NAME')} <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.custom_name}
                  onChange={(e) => { setFormData({ ...formData, custom_name: e.target.value }); setErrors(prev => ({ ...prev, custom_name: '' })); }}
                  placeholder={t('PLACEHOLDER_CUSTOM_NAME')}
                  className={`${isDark ? 'bg-white/10 text-white border-white/20' : ''} ${errors.custom_name ? 'border-red-500' : ''}`}
                />
                {errors.custom_name && <p className="text-red-500 text-xs mt-1">{errors.custom_name}</p>}
              </div>
            )}

            <div>
              <Label className="mb-2 block">{t('DATE_ISSUED')} <span className="text-red-500">*</span></Label>
              <DatePicker
                value={formData.date_issued}
                onChange={(value) => { setFormData({ ...formData, date_issued: value }); setErrors(prev => ({ ...prev, date_issued: '' })); }}
                placeholder={t('PLACEHOLDER_DATE_ISSUED')}
                error={!!errors.date_issued}
              />
              {errors.date_issued && <p className="text-red-500 text-xs mt-1">{errors.date_issued}</p>}
            </div>

            <div>
              <Label className="mb-2 block">{t('RENEWAL_DATE_LABEL')} <span className="text-red-500">*</span></Label>
              <DatePicker
                value={formData.renewal_date}
                onChange={(value) => { setFormData({ ...formData, renewal_date: value }); setErrors(prev => ({ ...prev, renewal_date: '' })); }}
                placeholder={t('PLACEHOLDER_RENEWAL_DATE')}
                error={!!errors.renewal_date}
              />
              {errors.renewal_date && <p className="text-red-500 text-xs mt-1">{errors.renewal_date}</p>}
            </div>

            <div>
              <Label className="mb-2 block">{t('NOTIFY_ME_AT')} <span className="text-red-500">*</span></Label>
              <TimePickerInput
                value={formData.notification_time}
                onChange={(time) => setFormData({ ...formData, notification_time: time })}
                isDark={isDark}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Notifications will be sent at this time daily {t('NOTIFICATIONS_TIMEZONE')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t('ENABLE_REMINDERS')}</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="premium-switch"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={resetForm} className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}>
                {t('CANCEL')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black font-semibold hover:opacity-90"
              >
                {createMutation.isPending || updateMutation.isPending ? t('SAVING') : t('SAVE')}
              </Button>
            </div>
          </div>
        </ModalContainer>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className={`max-w-sm ${isDark ? 'card-dark text-white' : 'modal-light'}`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                {t('CONFIRM_DELETE_REMINDER')}
              </DialogTitle>
              <DialogDescription className={isDark ? 'text-white/60' : 'text-gray-500'}>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { setDeleteConfirmOpen(false); setReminderToDelete(null); }}
                className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
              >
                {t('CANCEL')}
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PremiumPaywallSheet open={paywallOpen} onClose={closePaywall} context={paywallContext} />
      </div>
    </div>
  );
}
