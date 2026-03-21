import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Preferences } from '@capacitor/preferences';
import { formatMoney, formatDate, formatNumber, getPreferences, setPreferences } from '../utils/formatters';
import translations from '../locales/translations';
import { initNativePush } from '@/components/utils/push/nativePushOneSignal';
import { applyThemeToDocument, updateThemeColorMeta, updateAppleStatusBar } from '@/components/utils/themeInitializer';
import { StatusBar, Style } from '@capacitor/status-bar';
import { initDatabase } from '@/database/db';
import { scheduleAllReminders } from '@/services/reminderEngine';
import { insertNotificationLog } from '@/database/genericRepository';

const FULL_ACCESS_MODE = false;

const DARK_STATUS_BG = '#001A00';
const LIGHT_STATUS_BG = '#F0F7E8';

const PREF_CURRENCY_KEY = 'routenet_pref_currency';
const PREF_DATE_FORMAT_KEY = 'routenet_pref_date_format';
const PREF_THEME_KEY = 'routenet_pref_theme';
const EXPLICIT_LOGOUT_KEY = 'routenet_explicit_logout';
const USER_CACHE_KEY = 'routenet_cached_user';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(PREF_THEME_KEY);
      return stored === 'dark' || stored === 'light' ? stored : 'light';
    } catch {
      return 'light';
    }
  });

  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [formatPrefs, setFormatPrefs] = useState(getPreferences());
  const hasBootedRef = useRef(false);

  const clearAppUserState = () => {
    setUser(null);
    window.__routenet_user_email__ = '';
  };

  const restoreCachedUserIfAllowed = async () => {
    try {
      const [{ value: explicitLogout }, { value }] = await Promise.all([
        Preferences.get({ key: EXPLICIT_LOGOUT_KEY }),
        Preferences.get({ key: USER_CACHE_KEY }),
      ]);

      if (explicitLogout === '1') {
        clearAppUserState();
        return null;
      }

      if (!value) {
        clearAppUserState();
        return null;
      }

      const cachedUser = JSON.parse(value);
      setUser(cachedUser);

      if (cachedUser?.email) {
        window.__routenet_user_email__ = cachedUser.email;
      } else {
        window.__routenet_user_email__ = '';
      }

      return cachedUser;
    } catch (e) {
      clearAppUserState();
      return null;
    }
  };

  useEffect(() => {
    const syncThemeFromPreferences = async () => {
      try {
        const localTheme = localStorage.getItem(PREF_THEME_KEY);
        if (!localTheme) {
          const { value } = await Preferences.get({ key: PREF_THEME_KEY });
          if (value === 'dark' || value === 'light') {
            localStorage.setItem(PREF_THEME_KEY, value);
            setTheme(value);
          }
        }
      } catch (e) {}
    };

    syncThemeFromPreferences();
  }, []);

  const syncStatusBar = async (currentTheme) => {
    const bg = currentTheme === 'dark' ? DARK_STATUS_BG : LIGHT_STATUS_BG;

    updateThemeColorMeta(currentTheme);
    updateAppleStatusBar(currentTheme);

    try {
      const capStyle = currentTheme === 'dark' ? Style.Dark : Style.Light;
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: capStyle });
      await StatusBar.setBackgroundColor({ color: bg });
    } catch (e) {}
  };

  const loadUserPreferences = async () => {
    try {
      const { value: explicitLogout } = await Preferences.get({ key: EXPLICIT_LOGOUT_KEY });

      if (explicitLogout === '1') {
        clearAppUserState();
        return;
      }

      const currentUser = await Promise.race([
        base44.auth.me(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 10000)),
      ]);

      await Preferences.remove({ key: EXPLICIT_LOGOUT_KEY });

      if (!currentUser.trial_start_date && !currentUser.subscription_tier) {
        const trialStart = new Date().toISOString();
        await base44.auth.updateMe({
          trial_start_date: trialStart,
          subscription_tier: 'free',
        });
        currentUser.trial_start_date = trialStart;
        currentUser.subscription_tier = 'free';
      }

      const CURRENT_ONBOARDING_VERSION = 2;
      const isOnOnboardingPage = window.location.hash.includes('onboarding');

      if (
        !isOnOnboardingPage &&
        (!currentUser.onboarding_version ||
          currentUser.onboarding_version !== CURRENT_ONBOARDING_VERSION)
      ) {
        window.location.hash = '#/onboarding';
        return;
      }

      setUser(currentUser);

      if (currentUser?.email) {
        window.__routenet_user_email__ = currentUser.email;
      } else {
        window.__routenet_user_email__ = '';
      }

      const dbLanguage = currentUser.language_preference;
      const deviceLanguage =
        navigator.language?.startsWith('tl') || navigator.language?.startsWith('fil') ? 'tl' : 'en';
      const finalLanguage = dbLanguage || deviceLanguage;

      if (dbLanguage !== finalLanguage) {
        await base44.auth.updateMe({ language_preference: finalLanguage });
      }
      setLanguageState(finalLanguage);

      const dbCurrency = currentUser.currency_preference;
      const localCurrency = localStorage.getItem(PREF_CURRENCY_KEY);

      if (dbCurrency) {
        localStorage.setItem(PREF_CURRENCY_KEY, dbCurrency);
        setFormatPrefs(prev => ({ ...prev, currency: dbCurrency }));
      } else if (localCurrency) {
        await base44.auth.updateMe({ currency_preference: localCurrency });
      }

      const dbDateFormat = currentUser.date_format_preference;
      const localDateFormat = localStorage.getItem(PREF_DATE_FORMAT_KEY);

      if (dbDateFormat) {
        localStorage.setItem(PREF_DATE_FORMAT_KEY, dbDateFormat);
        setFormatPrefs(prev => ({ ...prev, dateFormat: dbDateFormat }));
      } else if (localDateFormat) {
        await base44.auth.updateMe({ date_format_preference: localDateFormat });
      }

      if (currentUser.theme_preference) {
        const resolvedTheme = currentUser.theme_preference;
        localStorage.setItem(PREF_THEME_KEY, resolvedTheme);
        Preferences.set({ key: PREF_THEME_KEY, value: resolvedTheme }).catch(() => {});
        setTheme(resolvedTheme);
      }

      await syncStatusBar(currentUser.theme_preference || theme);
    } catch (error) {
      await restoreCachedUserIfAllowed();
      await syncStatusBar(theme);
    }
  };

  useEffect(() => {
    if (hasBootedRef.current) return;
    hasBootedRef.current = true;

    const bootApp = async () => {
      await initDatabase();
      await loadUserPreferences();
      setFormatPrefs(getPreferences());
      setIsBooting(false);
    };

    bootApp().catch(async () => {
      setIsBooting(false);
      await syncStatusBar(theme);
    });
  }, [theme]);

  useEffect(() => {
    applyThemeToDocument(theme);
    syncStatusBar(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const syncLogoutGuard = async () => {
      try {
        const { value: explicitLogout } = await Preferences.get({ key: EXPLICIT_LOGOUT_KEY });
        if (!cancelled && explicitLogout === '1') {
          clearAppUserState();
        }
      } catch (e) {}
    };

    syncLogoutGuard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    initNativePush({ userId: user.email });

    scheduleAllReminders(user.email).catch(e =>
      console.warn('[AppContext] scheduleAllReminders failed (non-fatal):', e)
    );

    let localNotifListenerCleanup = null;

    const registerLocalNotifListener = async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        const listenerHandle = await LocalNotifications.addListener(
          'localNotificationReceived',
          async (notification) => {
            try {
              const now = new Date().toISOString();
              const recordId = notification?.extra?.recordId || String(notification.id);
              const notifId = `local_${notification.id}_${Date.now()}`;

              const title = notification.title || '';
              let category = 'general';
              let type = 'general';

              if (title.includes('Renewal')) {
                category = 'renewals';
                type = 'renewal_alert';
              } else if (title.includes('Maintenance')) {
                category = 'maintenance';
                type = 'maintenance_alert';
              } else if (title.includes('Savings')) {
                category = 'savings';
                type = 'savings_goal';
              } else if (title.includes('Spending') || title.includes('Limit')) {
                category = 'transactions';
                type = 'expense_limit';
              }

              await insertNotificationLog({
                id: notifId,
                remote_id: null,
                type,
                category,
                title: notification.title || 'Reminder',
                body: notification.body || '',
                is_read: false,
                scheduled_for: null,
                related_id: recordId,
                created_by: user.email,
                created_at: now,
              });

              console.log('[AppContext] Local notification delivered to inbox:', notifId);
            } catch (e) {
              console.warn('[AppContext] insertNotificationLog for local notif failed (non-fatal):', e);
            }
          }
        );

        localNotifListenerCleanup = () => {
          try {
            listenerHandle?.remove();
          } catch (e) {}
        };
      } catch (e) {
        console.warn('[AppContext] LocalNotifications listener not registered (non-fatal):', e);
      }
    };

    registerLocalNotifListener();

    return () => {
      if (localNotifListenerCleanup) {
        localNotifListenerCleanup();
      }
    };
  }, [user?.email]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en?.[key] || key;
  };

  const setLanguage = async (newLang) => {
    setLanguageState(newLang);

    if (user) {
      try {
        await base44.auth.updateMe({ language_preference: newLang });
      } catch (error) {
        await restoreCachedUserIfAllowed();
        console.error('[AppContext] Failed to update language preference:', error);
      }
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'tl' : 'en';
    await setLanguage(newLang);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const htmlEl = document.documentElement;

    htmlEl.classList.add('theme-switching');
    applyThemeToDocument(newTheme);
    await syncStatusBar(newTheme);
    setTheme(newTheme);

    try {
      localStorage.setItem(PREF_THEME_KEY, newTheme);
    } catch (e) {}
    Preferences.set({ key: PREF_THEME_KEY, value: newTheme }).catch(() => {});

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        htmlEl.classList.remove('theme-switching');
      });
    });

    if (user) {
      try {
        await base44.auth.updateMe({ theme_preference: newTheme });
      } catch (error) {
        await restoreCachedUserIfAllowed();
        console.error('[AppContext] Failed to update theme preference:', error);
      }
    }
  };

  const updateFormatPrefs = async (newPrefs) => {
    setPreferences(newPrefs);
    setFormatPrefs(getPreferences());

    if (user) {
      try {
        const updates = {};
        if (newPrefs.currency) updates.currency_preference = newPrefs.currency;
        if (newPrefs.dateFormat) updates.date_format_preference = newPrefs.dateFormat;

        if (Object.keys(updates).length > 0) {
          await base44.auth.updateMe(updates);
        }
      } catch (error) {
        await restoreCachedUserIfAllowed();
        console.error('[AppContext] Failed to sync preferences to database:', error);
      }
    }
  };

  const getTrialDaysUsed = () => {
    if (!user?.trial_start_date) return 0;
    const startDate = new Date(user.trial_start_date);
    const now = new Date();
    const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff);
  };

  const isTrialActive = () => {
    if (FULL_ACCESS_MODE) return true;
    if (!user?.trial_start_date) return false;
    return getTrialDaysUsed() < 30;
  };

  const isPremium = () => {
    if (FULL_ACCESS_MODE) return true;
    return user?.subscription_tier === 'pro';
  };

  const isReadOnly = () => {
    if (FULL_ACCESS_MODE) return false;
    if (!user) return false;
    if (isPremium()) return false;
    return getTrialDaysUsed() >= 30;
  };

  const shouldShowAds = () => {
    if (FULL_ACCESS_MODE) return false;
    if (!user) return false;
    return !isPremium() && !isTrialActive();
  };

  if (isBooting) {
    const bootBg = theme === 'dark' ? '#001a0a' : '#F0F7E8';
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bootBg }} />
    );
  }

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        user,
        t,
        toggleLanguage,
        toggleTheme,
        isTrialActive,
        isPremium,
        isReadOnly,
        shouldShowAds,
        setUser,
        getTrialDaysUsed,
        formatPrefs,
        updateFormatPrefs,
        formatCurrency: (amount) => formatMoney(amount, formatPrefs),
        formatNumber: (num) => formatNumber(num, formatPrefs),
        formatDate: (date) => formatDate(date, formatPrefs),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};