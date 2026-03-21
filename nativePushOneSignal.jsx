import { base44 } from '@/api/base44Client';

let isInitialized = false;

// ✅ FIX: The old code used window.median.onesignal which is the Median WebView SDK.
// This app is built with Capacitor + onesignal-cordova-plugin@5.x which exposes
// window.plugins.OneSignal — a completely different object.
// window.median NEVER exists in a Capacitor APK, so isNativeRuntime() always
// returned false, push init was skipped entirely, devices never registered,
// and no push notifications ever arrived or showed in the bell count.

export function isNativeRuntime() {
  // Capacitor cordova plugin exposes window.plugins.OneSignal
  // Also check for Capacitor itself as a fallback
  return (
    typeof window !== 'undefined' &&
    (
      typeof window.plugins?.OneSignal !== 'undefined' ||
      window.Capacitor?.isNativePlatform?.() === true ||
      /wv|Android.*AppleWebKit/.test(navigator.userAgent)
    )
  );
}

// Store last tap event for cold start recovery
// When app is closed and user taps notification, the event fires before
// React mounts. We store it and replay it after listeners are registered.
window.__pendingPushTap = null;

export async function initNativePush({ userId }) {
  if (!isNativeRuntime()) {
    console.log('[NativePush] Not in native runtime, skipping push init');
    return;
  }

  if (isInitialized) {
    console.log('[NativePush] Already initialized, skipping');
    return;
  }

  try {
    // Wait for OneSignal plugin to be available (Capacitor bridge may not be ready immediately)
    let attempts = 0;
    while (!window.plugins?.OneSignal && attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    const OneSignal = window.plugins?.OneSignal;
    if (!OneSignal) {
      console.warn('[NativePush] window.plugins.OneSignal not available after waiting');
      return;
    }

    console.log('[NativePush] OneSignal plugin found, initializing for user:', userId);

    // Login with user ID so OneSignal can target this user
    if (OneSignal.login) {
      await OneSignal.login(userId);
      console.log('[NativePush] OneSignal.login() called for:', userId);
    } else if (OneSignal.User?.addAlias) {
      // v5 SDK approach
      OneSignal.User.addAlias('external_id', userId);
      console.log('[NativePush] OneSignal external_id set for:', userId);
    }

    // Wait for subscription to be established
    await new Promise(r => setTimeout(r, 2000));

    // Get subscription/device ID
    let playerId = null;

    try {
      if (OneSignal.User?.pushSubscription?.id) {
        playerId = OneSignal.User.pushSubscription.id;
      } else if (OneSignal.getDeviceState) {
        const state = await new Promise(resolve => {
          OneSignal.getDeviceState(s => resolve(s));
        });
        playerId = state?.userId || state?.pushToken || null;
      }
    } catch (e) {
      console.warn('[NativePush] Could not get player ID:', e);
    }

    if (playerId) {
      console.log('[NativePush] Got player ID:', playerId);
      await registerDevice(userId, playerId);
    } else {
      console.warn('[NativePush] No player ID yet, scheduling retry...');
      setTimeout(async () => {
        try {
          let retryId = null;
          if (window.plugins?.OneSignal?.User?.pushSubscription?.id) {
            retryId = window.plugins.OneSignal.User.pushSubscription.id;
          } else if (window.plugins?.OneSignal?.getDeviceState) {
            const state = await new Promise(resolve => {
              window.plugins.OneSignal.getDeviceState(s => resolve(s));
            });
            retryId = state?.userId || null;
          }
          if (retryId) {
            console.log('[NativePush] Retry got player ID:', retryId);
            await registerDevice(userId, retryId);
          } else {
            console.warn('[NativePush] Retry: still no player ID');
          }
        } catch (e) {
          console.error('[NativePush] Retry failed:', e);
        }
      }, 5000);
    }

    // Notification opened handler — fires when app is OPEN and notification is tapped
    try {
      if (OneSignal.Notifications?.addClickListener) {
        // v5 SDK
        OneSignal.Notifications.addClickListener((event) => {
          try {
            console.log('[NativePush] Notification tapped (v5):', JSON.stringify(event));
            const additionalData = event?.notification?.additionalData || event?.notification?.data || {};
            const deepLink = additionalData?.deep_link || event?.notification?.launchURL || '/notifications';
            console.log('[NativePush] Dispatching navigate event to:', deepLink);
            const tapDetail = {
                deepLink,
                title: event?.notification?.title || '',
                body: event?.notification?.body || '',
                type: additionalData?.type || 'general',
                category: additionalData?.category || 'general',
                notification_id: additionalData?.notification_id || null,
              };
            window.__pendingPushTap = tapDetail;
            window.dispatchEvent(new CustomEvent('pushNotificationTap', { detail: tapDetail }));
          } catch (e) {
            console.error('[NativePush] Click listener error:', e);
          }
        });
        console.log('[NativePush] v5 click listener registered');

        if (OneSignal.Notifications?.addForegroundWillDisplayListener) {
          OneSignal.Notifications.addForegroundWillDisplayListener((event) => {
            try {
              window.dispatchEvent(new CustomEvent('nativePushForeground', { detail: event }));
            } catch (e) {
              console.warn('[NativePush] Foreground dispatch failed:', e);
            }
          });
          console.log('[NativePush] v5 foreground listener registered');
        }
      } else if (OneSignal.setNotificationOpenedHandler) {
        // Older SDK
        OneSignal.setNotificationOpenedHandler((data) => {
          try {
            console.log('[NativePush] Notification tapped (legacy):', JSON.stringify(data));
            const additionalData = data?.notification?.additionalData || data?.notification?.data || {};
            const deepLink = additionalData?.deep_link || data?.notification?.deep_link || '/notifications';
            console.log('[NativePush] Dispatching navigate event to:', deepLink);
            window.dispatchEvent(new CustomEvent('pushNotificationTap', {
              detail: {
                deepLink,
                title: event?.notification?.title || '',
                body: event?.notification?.body || '',
                type: additionalData?.type || 'general',
                category: additionalData?.category || 'general',
                notification_id: additionalData?.notification_id || null,
              }
            }));
          } catch (e) {
            console.error('[NativePush] Opened handler error:', e);
          }
        });
        console.log('[NativePush] Legacy opened handler registered');
      }
    } catch (e) {
      console.warn('[NativePush] Could not register opened handler:', e);
    }

    // FIX: Cold-start launch notification check
    // When app is opened by tapping a notification, the click listener
    // may not be registered in time. getLaunchNotification() returns
    // the notification that launched the app — process it directly here.
    try {
      if (OneSignal.Notifications?.getLaunchNotification) {
        const launchNotif = await OneSignal.Notifications.getLaunchNotification();
        if (launchNotif) {
          console.log('[NativePush] Launch notification found:', JSON.stringify(launchNotif));
          const additionalData = launchNotif?.additionalData || launchNotif?.data || {};
          const deepLink = additionalData?.deep_link || launchNotif?.launchURL || '/notifications';
          const tapDetail = {
            deepLink,
            title: launchNotif?.title || '',
            body: launchNotif?.body || '',
            type: additionalData?.type || 'general',
            category: additionalData?.category || 'general',
            notification_id: additionalData?.notification_id || null,
          };
          window.__pendingPushTap = tapDetail;
          console.log('[NativePush] Stored launch notification as pending tap');
        }
      }
    } catch (e) {
      console.warn('[NativePush] getLaunchNotification failed (non-fatal):', e);
    }

    // Request notification permission if not already granted
    try {
      if (OneSignal.Notifications?.requestPermission) {
        await OneSignal.Notifications.requestPermission(true);
        console.log('[NativePush] Permission requested');
      } else if (OneSignal.promptForPushNotificationsWithUserResponse) {
        OneSignal.promptForPushNotificationsWithUserResponse(true);
        console.log('[NativePush] Permission prompt shown (legacy)');
      }
    } catch (e) {
      console.warn('[NativePush] Permission request failed:', e);
    }

    isInitialized = true;
    console.log('[NativePush] Initialization complete for:', userId);

  } catch (error) {
    console.error('[NativePush] Init error:', error);
  }
}

export async function logoutNativePush() {
  if (!isNativeRuntime()) return;
  try {
    const OneSignal = window.plugins?.OneSignal;
    if (OneSignal?.logout) {
      await OneSignal.logout();
    } else if (OneSignal?.removeExternalUserId) {
      OneSignal.removeExternalUserId();
    }
    isInitialized = false;
    console.log('[NativePush] Logged out from OneSignal');
  } catch (e) {
    console.error('[NativePush] Logout error:', e);
  }
}

async function registerDevice(userId, playerId) {
  try {
    console.log('[NativePush] Registering device in Base44:', { userId, playerId });

    const existing = await base44.entities.PushDevice.filter(
      { onesignal_player_id: playerId },
      '-created_date',
      1
    );

    const now = new Date().toISOString();

    if (existing.length > 0) {
      await base44.entities.PushDevice.update(existing[0].id, {
        user_id: userId,
        last_seen_at: now,
        is_enabled: true
      });
      console.log('[NativePush] Device updated in Base44');
    } else {
      await base44.entities.PushDevice.create({
        user_id: userId,
        onesignal_player_id: playerId,
        platform: 'android',
        is_enabled: true,
        last_seen_at: now
      });
      console.log('[NativePush] Device registered in Base44');
    }
  } catch (error) {
    console.error('[NativePush] Device registration error:', error);
  }
}
