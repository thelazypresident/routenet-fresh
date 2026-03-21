import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useApp } from '../contexts/AppContext';

// FIX: The original used localStorage to track whether the trial/renewal
// popup had already been shown to the user ('reminder_shown_*' keys).
// localStorage can be cleared by the mobile OS. If cleared, every cold
// start shows the popup again regardless of how many times the user
// dismissed it — creating an annoying experience for the driver.
//
// Fix: replaced all localStorage.getItem and localStorage.setItem calls
// with Capacitor Preferences.get and Preferences.set. Preferences are
// OS-safe persistent storage that survive mobile cache clears.

export function useReminderState() {
  const { user, isPremium, isTrialActive } = useApp();
  const [reminderType, setReminderType] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);

  useEffect(() => {
    if (!user) {
      setReminderType(null);
      setDaysRemaining(0);
      setShouldShowPopup(false);
      return;
    }

    const checkReminders = async () => {
      const now = new Date();

      // A) FREE TRIAL ENDING (48 hours = 2 days)
      if (!isPremium() && isTrialActive() && user.trial_end_date) {
        const trialEnd = new Date(user.trial_end_date);
        const hoursUntilEnd = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilEnd > 0 && hoursUntilEnd <= 48) {
          const days = Math.ceil(hoursUntilEnd / 24);
          setReminderType('trial');
          setDaysRemaining(days);

          // FIX: Use Capacitor Preferences instead of localStorage
          const shownKey = `reminder_shown_trial_${user.trial_end_date}`;
          try {
            const { value } = await Preferences.get({ key: shownKey });
            setShouldShowPopup(!value);
          } catch (e) {
            setShouldShowPopup(true);
          }
          return;
        }
      }

      // B) MONTHLY SUBSCRIPTION RENEWAL (3 days)
      if (
        isPremium() &&
        user.subscription_plan === 'monthly' &&
        user.subscription_status === 'active' &&
        user.subscription_renewal_date
      ) {
        const renewalDate = new Date(user.subscription_renewal_date);
        const hoursUntilRenewal = (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilRenewal > 0 && hoursUntilRenewal <= 72) {
          const days = Math.ceil(hoursUntilRenewal / 24);
          setReminderType('monthly');
          setDaysRemaining(days);

          // FIX: Use Capacitor Preferences instead of localStorage
          const shownKey = `reminder_shown_monthly_${user.subscription_renewal_date}`;
          try {
            const { value } = await Preferences.get({ key: shownKey });
            setShouldShowPopup(!value);
          } catch (e) {
            setShouldShowPopup(true);
          }
          return;
        }
      }

      // C) YEARLY SUBSCRIPTION RENEWAL (3 days)
      if (
        isPremium() &&
        user.subscription_plan === 'annual' &&
        user.subscription_status === 'active' &&
        user.subscription_renewal_date
      ) {
        const renewalDate = new Date(user.subscription_renewal_date);
        const hoursUntilRenewal = (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilRenewal > 0 && hoursUntilRenewal <= 72) {
          const days = Math.ceil(hoursUntilRenewal / 24);
          setReminderType('yearly');
          setDaysRemaining(days);

          // FIX: Use Capacitor Preferences instead of localStorage
          const shownKey = `reminder_shown_yearly_${user.subscription_renewal_date}`;
          try {
            const { value } = await Preferences.get({ key: shownKey });
            setShouldShowPopup(!value);
          } catch (e) {
            setShouldShowPopup(true);
          }
          return;
        }
      }

      // No reminder needed
      setReminderType(null);
      setDaysRemaining(0);
      setShouldShowPopup(false);
    };

    checkReminders();

    const interval = setInterval(checkReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, isPremium, isTrialActive]);

  const markPopupShown = async () => {
    if (!user || !reminderType) return;

    let shownKey = '';

    if (reminderType === 'trial' && user.trial_end_date) {
      shownKey = `reminder_shown_trial_${user.trial_end_date}`;
    } else if (reminderType === 'monthly' && user.subscription_renewal_date) {
      shownKey = `reminder_shown_monthly_${user.subscription_renewal_date}`;
    } else if (reminderType === 'yearly' && user.subscription_renewal_date) {
      shownKey = `reminder_shown_yearly_${user.subscription_renewal_date}`;
    }

    if (shownKey) {
      // FIX: Use Capacitor Preferences instead of localStorage
      // so this persists across OS cache clears
      await Preferences.set({ key: shownKey, value: 'true' }).catch(() => {});
    }

    setShouldShowPopup(false);
  };

  return {
    reminderType,
    daysRemaining,
    shouldShowPopup,
    markPopupShown
  };
}
