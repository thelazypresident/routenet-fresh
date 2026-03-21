import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Trash2, Pencil, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { base44 } from '@/api/base44Client';
import {
  createLocalSavingsGoal,
  updateLocalSavingsGoal,
  deleteLocalSavingsGoal,
  getLocalSavingsGoals,
} from '@/database/genericRepository';
import { syncSavingsGoals } from '@/services/syncService';
import {
  scheduleSavingsNotification,
  cancelReminderNotification,
} from '@/services/reminderEngine';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import DatePicker from '../components/ui/DatePicker';
import TimePickerInput from '../components/ui/TimePickerInput';
import { usePremiumGate } from '../components/premium/usePremiumGate';
import PremiumPaywallSheet from '../components/premium/PremiumPaywallSheet';
import ReadOnlyBanner from '../components/ReadOnlyBanner';

// FIX: Removed the entire localStorage queue (QUEUE_KEY, getQueue, pushToQueue,
// removeFromQueue, buildOptimisticGoal). This was dead code — pushToQueue was
// never called in handleAddGoal, and the queue was never read by anything.
// SQLite via createLocalSavingsGoal is the correct offline storage mechanism.

export default function Savings() {
  const { t, theme, user, isPremium, isTrialActive, isReadOnly, formatCurrency } = useApp();
  const { isOnline } = useOffline();
  const { checkPremiumAccess, paywallOpen, paywallContext, closePaywall } = usePremiumGate();
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  const { data: goals = [], refetch } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      
      // Read from SQLite — local-first source of truth.
      // If online, sync first so SQLite has the latest data from Base44.
      if (isOnline) {
        syncSavingsGoals(user?.email).catch(e => console.warn('[Savings] sync:', e));
      }
      return getLocalSavingsGoals();
    },
    
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // FIX: Removed offlineGoals state and the entire flushSavingsQueue / merge
  // pattern. Goals now go directly to SQLite which getLocalSavingsGoals() reads.
  // The merge was redundant and caused potential duplicate rendering.

  // FIX: Removed triggerRefetch with setTimeout — SQLite is already updated
  // when we call refetch(), so the delay was a race condition, not a fix.

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    icon: '',
    deadline: '',
    notification_time: '08:00'
  });
  const [goalPreset, setGoalPreset] = useState('');
  const [customGoalName, setCustomGoalName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const goalPresets = [
    { value: 'health_emergency', label: 'Health / Emergency', emoji: '🩺', iconKey: 'health_emergency' },
    { value: 'personal', label: 'Personal', emoji: '👤', iconKey: 'personal' },
    { value: 'travel', label: 'Travel', emoji: '✈️', iconKey: 'travel' },
    { value: 'new_motorbike', label: 'New Motorbike', emoji: '🏍️', iconKey: 'new_motorbike' },
    { value: 'new_car', label: 'New Car', emoji: '🚗', iconKey: 'new_car' },
    { value: 'house', label: 'House', emoji: '🏠', iconKey: 'house' },
    { value: 'other', label: 'Other (Please specify)', emoji: '🧾', iconKey: 'other' }
  ];

  const calculateProgress = (current, target) => Math.min((current / target) * 100, 100);

  const detectIconFromName = (name) => {
    if (!name) return 'other';
    const n = name.toLowerCase();
    if (n.includes('iphone') || n.includes('phone') || n.includes('mobile')) return 'phone';
    if (n.includes('laptop') || n.includes('computer') || n.includes('pc')) return 'laptop';
    if (n.includes('camera')) return 'camera';
    if (n.includes('wedding') || n.includes('marriage')) return 'wedding';
    if (n.includes('travel') || n.includes('vacation') || n.includes('trip')) return 'travel';
    if (n.includes('motorbike') || n.includes('motorcycle')) return 'new_motorbike';
    if (n.includes('car') || n.includes('vehicle')) return 'new_car';
    if (n.includes('house') || n.includes('home')) return 'house';
    return 'other';
  };

  useEffect(() => {
    if (!goalPreset) return;
    const preset = goalPresets.find(p => p.value === goalPreset);
    if (!preset) return;
    setNewGoal(prev => ({ ...prev, icon: preset.iconKey }));
    if (preset.value !== 'other') {
      setCustomGoalName('');
      setNewGoal(prev => ({ ...prev, name: preset.label }));
    } else {
      setNewGoal(prev => ({ ...prev, name: customGoalName || '' }));
    }
    setErrors(prev => ({ ...prev, name: '' }));
  }, [goalPreset]);

  useEffect(() => {
    if (goalPreset !== 'other') return;
    setNewGoal(prev => ({ ...prev, name: customGoalName }));
    if (customGoalName) setErrors(prev => ({ ...prev, name: '' }));
  }, [customGoalName, goalPreset]);

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalPreset(goal.icon === 'other' || !goalPresets.find(p => p.iconKey === goal.icon) ? 'other' : goalPresets.find(p => p.iconKey === goal.icon)?.value || 'other');
    setCustomGoalName(goal.icon === 'other' || !goalPresets.find(p => p.iconKey === goal.icon) ? goal.name : '');
    setNewGoal({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      icon: goal.icon,
      deadline: goal.deadline || '',
      notification_time: goal.notification_time || '08:00'
    });
    setAddDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!goalPreset) newErrors.name = t('ERROR_SELECT_GOAL_TYPE');
    if (goalPreset === 'other' && !customGoalName.trim()) newErrors.name = t('ERROR_SPECIFY_GOAL_NAME');
    if (!newGoal.name) newErrors.name = newErrors.name || t('ERROR_SELECT_GOAL_TYPE');
    if (!newGoal.target_amount) newErrors.target_amount = t('ERROR_TARGET_AMOUNT');
    if (!newGoal.icon) newErrors.name = newErrors.name || t('ERROR_SELECT_GOAL_TYPE');
    return newErrors;
  };

  const handleAddGoal = async () => {
    if (isReadOnly()) { toast.error(t('UPGRADE_TO_EDIT')); return; }
    if (editingGoal) return handleUpdateGoal();

    const isFree = !isPremium() && !isTrialActive();
    if (isFree && goals.length >= 3) { checkPremiumAccess('More than 3 Savings Goals'); return; }

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setLoading(true);

    try {
      const finalIcon = goalPreset === 'other' ? detectIconFromName(customGoalName) : newGoal.icon;
      const goalData = {
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: 0,
        icon: finalIcon,
        deadline: newGoal.deadline || null,
        notification_time: newGoal.notification_time || '08:00',
        is_active: true,
      };

      // Write to SQLite first — instant, works offline and online
      const saved = await createLocalSavingsGoal({
        ...goalData,
        created_by: user?.email,
      });

      // FIX: Schedule local notification immediately after SQLite write.
      // Old code called base44.functions.invoke('scheduleSavingsGoalNotification')
      // which only works online and only after a cloud sync completes.
      // scheduleSavingsNotification() uses @capacitor/local-notifications
      // which fires on-device even when offline and app is closed.
      await scheduleSavingsNotification({
        id: saved.id,
        name: goalData.name,
        deadline: goalData.deadline,
        notification_time: goalData.notification_time,
        is_active: true,
      });

      // Push to Base44 in background if online — non-blocking
      if (isOnline && user?.email) {
        syncSavingsGoals(user?.email).catch(e =>
          console.warn('[Savings] create sync failed (non-fatal):', e)
        );
      }

      toast.success(t('GOAL_CREATED'));
      // FIX: Direct refetch — no setTimeout needed, SQLite is already updated
      refetch();
      resetForm();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('[Savings] create failed:', error);
      toast.error('Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setLoading(true);

    try {
      const finalIcon = goalPreset === 'other' ? detectIconFromName(customGoalName) : newGoal.icon;
      const updateData = {
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        icon: finalIcon,
        deadline: newGoal.deadline || null,
        notification_time: newGoal.notification_time || '08:00',
        is_active: true,
      };

      // Write to SQLite first — instant, works offline and online
      await updateLocalSavingsGoal(editingGoal.id, updateData);

      // FIX: Reschedule local notification after update
      await scheduleSavingsNotification({
        id: editingGoal.id,
        name: updateData.name,
        deadline: updateData.deadline,
        notification_time: updateData.notification_time,
        is_active: true,
      });

      if (isOnline && user?.email) {
        syncSavingsGoals(user?.email).catch(e =>
          console.warn('[Savings] update sync failed (non-fatal):', e)
        );
      }

      toast.success(t('GOAL_UPDATED'));
      // FIX: Direct refetch — no setTimeout
      refetch();
      resetForm();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('[Savings] update failed:', error);
      toast.error('Failed to update goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingGoal(null);
    setGoalPreset('');
    setCustomGoalName('');
    setNewGoal({ name: '', target_amount: '', icon: '', deadline: '', notification_time: '08:00' });
    setErrors({});
  };

  const deleteGoal = async (goal) => {
    if (isReadOnly()) { toast.error(t('UPGRADE_TO_EDIT')); return; }
    if (!confirm(t('CONFIRM_DELETE_GOAL'))) return;

    try {
      // Delete from SQLite immediately — works offline and online
      await deleteLocalSavingsGoal(goal.id);

      // FIX: Cancel the local notification when goal is deleted
      await cancelReminderNotification(goal.id);

      // Also delete from Base44 if online and it has a remote record
      if (isOnline && goal.remote_id) {
        base44.entities.SavingsGoal.delete(goal.remote_id)
          .catch(e => console.warn('[Savings] remote delete failed (non-fatal):', e));
      }

      toast.success(t('GOAL_DELETED'));
      // FIX: Direct refetch — no setTimeout
      refetch();
    } catch (error) {
      console.error('[Savings] delete failed:', error);
      toast.error(t('GOAL_DELETE_FAILED'));
    }
  };

  const iconMap = {
    target: '🎯', bike: '🏍️', emergency: '🚨', bills: '📄', savings: '💰',
    custom: '✨', health_emergency: '🩺', personal: '👤', travel: '✈️',
    new_motorbike: '🏍️', new_car: '🚗', house: '🏠', other: '🧾',
    phone: '📱', laptop: '💻', camera: '📷', wedding: '💍'
  };

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'page-container' : 'page-container-light'} overflow-x-hidden`}>
      <div className="max-w-screen-lg mx-auto px-3 py-4 space-y-3">
        {isReadOnly() && <ReadOnlyBanner />}

        <div className="flex items-center justify-between">
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('SAVINGS_GOALS')}</h1>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => {
                if (isReadOnly()) { toast.error(t('UPGRADE_TO_EDIT')); return; }
                const isFree = !isPremium() && !isTrialActive();
                if (isFree && goals.length >= 3) { checkPremiumAccess('More than 3 Savings Goals'); }
                else { setAddDialogOpen(true); }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all shadow-sm ${
                (isReadOnly() || (!isPremium() && !isTrialActive() && goals.length >= 3))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] hover:shadow-md'
              } text-black`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('ADD')}</span>
              {(isReadOnly() || (!isPremium() && !isTrialActive() && goals.length >= 3)) && <Lock className="w-3 h-3" />}
            </button>
            {!isPremium() && !isTrialActive() && goals.length >= 3 && (
              <p className="text-[10px] text-yellow-600 font-medium">{t('FREE_PLAN_GOAL_LIMIT')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto px-3 space-y-2">
        {goals.length === 0 ? (
          <div className={`rounded-xl p-6 shadow-sm text-center ${isDark ? 'card-dark' : 'card-light'}`}>
            <Target className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-[#66BB6A]/40' : 'text-gray-300'}`} />
            <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('NO_SAVINGS_GOALS')}</h3>
            <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{t('CREATE_FIRST_GOAL')}</p>
          </div>
        ) : (
          goals.map(goal => {
            const progress = calculateProgress(goal.current_amount || 0, goal.target_amount);
            return (
              <div key={goal.id} className={`rounded-xl p-3 shadow-sm ${isDark ? 'card-dark' : 'card-light'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{iconMap[goal.icon] || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{goal.name}</h3>
                      {goal.deadline && (
                        <p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                          {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isReadOnly() && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditGoal(goal)} className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <Pencil className={`w-3.5 h-3.5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-600'}`} />
                      </button>
                      <button onClick={() => deleteGoal(goal)} className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{t('LABEL_CURRENT')}</p>
                      <p className={`text-[18px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(goal.current_amount || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{t('LABEL_GOAL_TARGET')}</p>
                      <p className={`text-[18px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(goal.target_amount)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('LABEL_PROGRESS')}</span>
                      <span className={`text-[11px] font-bold ${progress >= 100 ? 'text-green-500' : isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(progress)}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : progress >= 70 ? 'bg-[#66BB6A]' : 'bg-[#66BB6A]/70'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {progress >= 100 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-[11px] font-medium text-green-500">{t('GOAL_ACHIEVED')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Sheet open={addDialogOpen} onOpenChange={() => { setAddDialogOpen(false); resetForm(); }}>
        <SheetContent hideClose={true} side="bottom" className={`${isDark ? 'card-dark' : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9] border border-gray-200'} h-[calc(100dvh-68px)] max-h-[calc(100dvh-68px)] flex flex-col !inset-x-0 !top-[68px] !bottom-0 !mt-0`}>
          <SheetHeader className={`mb-2 flex flex-row items-center justify-between pb-2 space-y-0 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <SheetTitle className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingGoal ? t('EDIT_SAVINGS_GOAL') : t('CREATE_SAVINGS_GOAL')}
            </SheetTitle>
            <button type="button" onClick={() => { setAddDialogOpen(false); resetForm(); }} className={`p-1 rounded-md ${isDark ? 'bg-red-900/50 border border-red-500' : 'bg-red-200 border border-red-500'}`}>
              <X className={`w-4 h-4 ${isDark ? 'text-red-300' : 'text-red-700'}`} strokeWidth={2.5} />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto pb-4 mt-0">
            <div className="space-y-4">
              <div>
                <Label className={`mb-2 block ${isDark ? 'text-white' : ''}`}>{t('LABEL_GOAL_NAME')} <span className="text-red-500">*</span></Label>
                <Select value={goalPreset} onValueChange={(value) => { setGoalPreset(value); setErrors(prev => ({ ...prev, name: '' })); }}>
                  <SelectTrigger className={`${isDark ? 'dark-select-trigger' : ''} ${errors.name ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={t('PLACEHOLDER_SELECT_GOAL_TYPE')} />
                  </SelectTrigger>
                  <SelectContent className={isDark ? 'dark-select-content' : 'light-select-content'}>
                    {goalPresets.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{p.emoji}</span>
                          <span>{p.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {goalPreset === 'other' && (
                  <div className="mt-2">
                    <Input value={customGoalName} onChange={(e) => setCustomGoalName(e.target.value)} placeholder={t('PLACEHOLDER_GOAL_NAME')} className={`${isDark ? 'bg-white/10 text-white border-white/20' : ''} ${errors.name ? 'border-red-500' : ''}`} />
                  </div>
                )}
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label className={`mb-2 block ${isDark ? 'text-white' : ''}`}>{t('LABEL_TARGET_AMOUNT')} <span className="text-red-500">*</span></Label>
                <Input type="number" value={newGoal.target_amount} onChange={(e) => { setNewGoal({ ...newGoal, target_amount: e.target.value }); setErrors(prev => ({ ...prev, target_amount: '' })); }} placeholder="0.00" className={`${isDark ? 'bg-white/10 text-white border-white/20' : ''} ${errors.target_amount ? 'border-red-500' : ''}`} />
                {errors.target_amount && <p className="text-red-500 text-xs mt-1">{errors.target_amount}</p>}
              </div>

              <div>
                <Label className={`mb-2 block ${isDark ? 'text-white' : ''}`}>{t('DEADLINE_OPTIONAL')}</Label>
                <DatePicker value={newGoal.deadline} onChange={(value) => setNewGoal({ ...newGoal, deadline: value })} placeholder={t('PLACEHOLDER_SELECT_DEADLINE')} />
              </div>

              <div>
                <Label className={`mb-2 block ${isDark ? 'text-white' : ''}`}>{t('NOTIFY_ME_AT')}</Label>
                <TimePickerInput value={newGoal.notification_time} onChange={(time) => setNewGoal({ ...newGoal, notification_time: time })} isDark={isDark} />
              </div>

              {!isOnline && (
                <p className="text-xs text-yellow-500 text-center">
                  📵 You're offline — goal will save locally and sync when reconnected.
                </p>
              )}

              <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  Amount added here is the amount you chose to set aside in real life.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }} disabled={loading} className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}>
                  {t('CANCEL')}
                </Button>
                <Button onClick={handleAddGoal} disabled={loading} className="flex-1 bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black font-semibold hover:opacity-90">
                  {loading ? (editingGoal ? t('UPDATING') : t('CREATING')) : (editingGoal ? t('SAVE_CHANGES') : t('CREATE_GOAL'))}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PremiumPaywallSheet open={paywallOpen} onClose={closePaywall} context={paywallContext} />
    </div>
  );
}
