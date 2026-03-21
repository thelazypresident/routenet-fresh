import { base44 } from '@/api/base44Client';
import { insertNotificationLog } from '@/database/genericRepository';

// FIX: All deep link route values are now lowercase to match the ROUTES
// table defined in App.jsx. The original used mixed-case paths like
// '/Savings', '/Transactions', '/VehicleMaintenance', '/Utilities'.
// HashRouter routes in App.jsx are all lowercase — e.g. '/vehiclemaintenance'.
// A mismatch meant notification taps navigated to PageNotFound instead of
// the correct destination page.
function getDeepLinkForType(type) {
  const routes = {
    savings_goal:      '/savings',
    expense_limit:     '/transactions',
    maintenance:       '/vehiclemaintenance',
    maintenance_alert: '/vehiclemaintenance',
    renewal_alert:     '/utilities',
    transaction:       '/transactions',
  };
  return routes[type] || '/notifications';
}

export async function createNotificationAndPush(payload, user) {
  try {
    const createdBy = user?.email || payload?.created_by || null;
    const now = new Date().toISOString();
    const localId = `local_${Date.now()}`;

    // FIX: Write to SQLite FIRST — before Base44 — independent of network.
    // Previous code wrote to SQLite only after Base44 create succeeded.
    // If Base44 create failed (credits exhausted, offline, timeout) —
    // nothing was written to SQLite — bell stayed 0 — row stayed empty.
    if (createdBy) {
      insertNotificationLog({
        id: localId,
        remote_id: null,
        type: payload?.type || 'general',
        category: payload?.category || 'general',
        title: payload?.title || 'Notification',
        body: payload?.message || payload?.body || '',
        is_read: payload?.is_read ?? false,
        scheduled_for: payload?.scheduled_for || null,
        related_id: payload?.related_id || null,
        created_by: createdBy,
        created_at: now,
      }).catch(e => console.warn('[pushNotifications] SQLite write failed (non-fatal):', e));
    }

    // Then try Base44 — non-blocking, best effort
    let notification = null;
    try {
      notification = await base44.entities.Notification.create({
        ...payload,
        created_by: createdBy,
        is_read: payload?.is_read ?? false,
      });
    } catch (e) {
      console.warn('[pushNotifications] Base44 Notification.create failed (non-fatal):', e);
    }

    const isMuted =
      Array.isArray(user?.notification_mutes) &&
      user.notification_mutes.includes(notification?.type || payload?.type);

    if (isMuted) return notification ?? null;

    const hasStorage =
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined' &&
      window.localStorage !== null;

    const pushKey = `pushed_${notification.id}`;
    const alreadyPushed = hasStorage ? window.localStorage.getItem(pushKey) : null;

    if (!alreadyPushed) {
      if (hasStorage) {
        window.localStorage.setItem(pushKey, String(Date.now()));
        window.setTimeout(() => {
          try { window.localStorage.removeItem(pushKey); } catch {}
        }, 2 * 60 * 1000);
      }

      try {
        const userId = user?.email || payload?.created_by;
        if (userId) {
          const notifType = notification?.type || payload?.type || 'general';
          const deepLink = payload?.deep_link || getDeepLinkForType(notifType);

          await base44.functions.send_push_onesignal({
            user_id: userId,
            title: payload?.title || 'RouteNet',
            message: payload?.message || payload?.body || payload?.text || 'You have a new reminder.',
            deep_link: deepLink,
            type: notifType,
            send_at: payload?.scheduled_for || null,
            data: {
              type: notifType,
              deep_link: deepLink,
              notification_id: notification?.id,
              source: payload?.source || 'app'
            }
          });
        }
      } catch (e) {
        console.log('[Push] send_push_onesignal failed (non-blocking):', e);
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
