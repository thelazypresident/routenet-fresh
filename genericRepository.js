/**
 * genericRepository.js
 *
 * Local SQLite repository for all entities OTHER than transactions.
 * Covers: savings_goals, expense_limits, renewal_reminders,
 *         maintenance, notification_log, profile.
 *
 * FIX: Removed WHERE created_by = ? from ALL read functions.
 *
 * Root cause confirmed via Android logcat (2026-03-16):
 *   - Every INSERT stores created_by = "" (empty string) because
 *     base44.auth.me() times out on device boot, AppContext.user is null,
 *     and pages pass user?.email || "" to the repository.
 *   - Every SELECT queries WHERE created_by = 'actual@email.com'
 *   - "" never matches → reads always return [] → pages always empty
 *
 * This is a single-user device. There is only one user's data in SQLite.
 * The created_by filter is unnecessary and was the root cause of every
 * "data not appearing" bug across all pages.
 *
 * Writes are unchanged — created_by is still stored for sync purposes.
 * Only reads are fixed.
 */

import { safeGetDb } from './db';

function makeId(prefix = 'rec') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── SAVINGS GOALS ────────────────────────────────────────────────────────────

export async function createLocalSavingsGoal(data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();
  const id = data.id || makeId('goal');

  await db.run(
    `INSERT INTO savings_goals
      (id, remote_id, name, target_amount, current_amount, icon, deadline,
       notification_time, is_active, created_by, created_at, updated_at,
       sync_status, sync_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
    [
      id,
      data.remote_id ?? null,
      data.name ?? '',
      data.target_amount ?? 0,
      data.current_amount ?? 0,
      data.icon ?? '',
      data.deadline ?? null,
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.created_by ?? '',
      data.created_at ?? now,
      data.updated_at ?? now,
    ]
  );

  return { ...data, id };
}

export async function updateLocalSavingsGoal(id, data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();

  await db.run(
    `UPDATE savings_goals
     SET name = ?, target_amount = ?, current_amount = ?, icon = ?,
         deadline = ?, notification_time = ?, is_active = ?,
         updated_at = ?, sync_status = 'pending', sync_error = NULL
     WHERE id = ?`,
    [
      data.name ?? '',
      data.target_amount ?? 0,
      data.current_amount ?? 0,
      data.icon ?? '',
      data.deadline ?? null,
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      now,
      id,
    ]
  );
}

export async function deleteLocalSavingsGoal(id) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');
  await db.run(`DELETE FROM savings_goals WHERE id = ?`, [id]);
}

/**
 * FIX: Removed WHERE created_by = ? — single-user device.
 * createdBy param kept for API compatibility but not used in query.
 */
export async function getLocalSavingsGoals(createdBy) {
  const db = await safeGetDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM savings_goals ORDER BY created_at DESC`
  );

  const rows = result.values || [];
  return rows.map(r => ({
    ...r,
    is_active: r.is_active === 1 || r.is_active === true,
  }));
}

// ─── EXPENSE LIMITS ───────────────────────────────────────────────────────────

export async function createLocalExpenseLimit(data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();
  const id = data.id || makeId('limit');

  await db.run(
    `INSERT INTO expense_limits
      (id, remote_id, amount, limit_type, notification_time, is_active,
       created_by, created_at, updated_at, sync_status, sync_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
    [
      id,
      data.remote_id ?? null,
      data.amount ?? 0,
      data.limit_type ?? 'daily',
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.created_by ?? '',
      data.created_at ?? now,
      data.updated_at ?? now,
    ]
  );

  return { ...data, id };
}

export async function updateLocalExpenseLimit(id, data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();

  await db.run(
    `UPDATE expense_limits
     SET amount = ?, limit_type = ?, notification_time = ?, is_active = ?,
         updated_at = ?, sync_status = 'pending', sync_error = NULL
     WHERE id = ?`,
    [
      data.amount ?? 0,
      data.limit_type ?? 'daily',
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      now,
      id,
    ]
  );
}

export async function deleteLocalExpenseLimit(id) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');
  await db.run(`DELETE FROM expense_limits WHERE id = ?`, [id]);
}

/**
 * FIX: Removed WHERE created_by = ?
 */
export async function getLocalExpenseLimits(createdBy) {
  const db = await safeGetDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM expense_limits ORDER BY created_at DESC`
  );

  const rows = result.values || [];
  return rows.map(r => ({
    ...r,
    is_active: r.is_active === 1 || r.is_active === true,
  }));
}

// ─── RENEWAL REMINDERS ────────────────────────────────────────────────────────

export async function createLocalRenewal(data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();
  const id = data.id || makeId('reminder');

  await db.run(
    `INSERT INTO renewal_reminders
      (id, remote_id, reminder_type, custom_name, date_issued, renewal_date,
       notification_time, is_active, created_by, created_at, updated_at,
       sync_status, sync_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
    [
      id,
      data.remote_id ?? null,
      data.reminder_type ?? '',
      data.custom_name ?? '',
      data.date_issued ?? null,
      data.renewal_date ?? null,
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.created_by ?? '',
      data.created_at ?? now,
      data.updated_at ?? now,
    ]
  );

  return { ...data, id };
}

export async function updateLocalRenewal(id, data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();

  await db.run(
    `UPDATE renewal_reminders
     SET reminder_type = ?, custom_name = ?, date_issued = ?, renewal_date = ?,
         notification_time = ?, is_active = ?,
         updated_at = ?, sync_status = 'pending', sync_error = NULL
     WHERE id = ?`,
    [
      data.reminder_type ?? '',
      data.custom_name ?? '',
      data.date_issued ?? null,
      data.renewal_date ?? null,
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      now,
      id,
    ]
  );
}

export async function deleteLocalRenewal(id) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');
  await db.run(`DELETE FROM renewal_reminders WHERE id = ?`, [id]);
}

/**
 * FIX: Removed WHERE created_by = ?
 */
export async function getLocalRenewals(createdBy) {
  const db = await safeGetDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM renewal_reminders ORDER BY renewal_date ASC`
  );

  const rows = result.values || [];
  return rows.map(r => ({
    ...r,
    is_active: r.is_active === 1 || r.is_active === true,
  }));
}

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────

export async function createLocalMaintenance(data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();
  const id = data.id || makeId('maint');

  await db.run(
    `INSERT INTO maintenance
      (id, remote_id, type, name, title, emoji, is_preset,
       last_odo_km, max_odo_interval_km, next_odo_km,
       reminders_enabled, date, cost, notes, vehicle_id,
       last_service_date, next_service_date, notification_time,
       is_active, created_by, created_at, updated_at, sync_status, sync_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
    [
      id,
      data.remote_id ?? null,
      data.type ?? '',
      data.name ?? '',
      data.title ?? data.name ?? '',
      data.emoji ?? '',
      data.is_preset !== undefined ? (data.is_preset ? 1 : 0) : 0,
      data.last_odo_km ?? 0,
      data.max_odo_interval_km ?? 0,
      data.next_odo_km ?? null,
      data.reminders_enabled !== undefined ? (data.reminders_enabled ? 1 : 0) : 1,
      data.date ?? null,
      data.cost ?? 0,
      data.notes ?? '',
      data.vehicle_id ?? null,
      data.last_service_date ?? null,
      data.next_service_date ?? null,
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.created_by ?? '',
      data.created_at ?? now,
      data.updated_at ?? now,
    ]
  );

  return { ...data, id };
}

export async function updateLocalMaintenance(id, data) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');

  const now = new Date().toISOString();

  await db.run(
    `UPDATE maintenance
     SET type = ?, name = ?, title = ?, emoji = ?, is_preset = ?,
         last_odo_km = ?, max_odo_interval_km = ?, next_odo_km = ?,
         reminders_enabled = ?, date = ?, cost = ?, notes = ?, vehicle_id = ?,
         last_service_date = ?, next_service_date = ?, notification_time = ?,
         is_active = ?, updated_at = ?, sync_status = 'pending', sync_error = NULL
     WHERE id = ?`,
    [
      data.type ?? '',
      data.name ?? '',
      data.title ?? data.name ?? '',
      data.emoji ?? '',
      data.is_preset !== undefined ? (data.is_preset ? 1 : 0) : 0,
      data.last_odo_km ?? 0,
      data.max_odo_interval_km ?? 0,
      data.next_odo_km ?? null,
      data.reminders_enabled !== undefined ? (data.reminders_enabled ? 1 : 0) : 1,
      data.date ?? null,
      data.cost ?? 0,
      data.notes ?? '',
      data.vehicle_id ?? null,
      data.last_service_date ?? null,
      data.next_service_date ?? null,
      data.notification_time ?? '08:00',
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      now,
      id,
    ]
  );
}

export async function deleteLocalMaintenance(id) {
  const db = await safeGetDb();
  if (!db) throw new Error('Database not available');
  await db.run(`DELETE FROM maintenance WHERE id = ?`, [id]);
}

/**
 * FIX: Removed WHERE created_by = ?
 */
export async function getLocalMaintenance(createdBy) {
  const db = await safeGetDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM maintenance ORDER BY date DESC`
  );

  const rows = result.values || [];
  return rows.map(r => ({
    ...r,
    is_active: r.is_active === 1 || r.is_active === true,
  }));
}

// ─── NOTIFICATION LOG ─────────────────────────────────────────────────────────

export async function insertNotificationLog(data) {
  const db = await safeGetDb();
  if (!db) return;

  const now = new Date().toISOString();
  const id = data.id || makeId('notif');

  try {
    await db.run(
      `INSERT OR REPLACE INTO notification_log
        (id, remote_id, type, category, title, body, is_read,
         scheduled_for, related_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.remote_id ?? null,
        data.type ?? '',
        data.category ?? '',
        data.title ?? '',
        data.body ?? data.message ?? '',
        data.is_read ? 1 : 0,
        data.scheduled_for ?? null,
        data.related_id ?? null,
        data.created_by ?? '',
        data.created_at ?? now,
      ]
    );
  } catch (e) {
    console.warn('[genericRepository] insertNotificationLog failed:', e);
  }
}

export async function getUnreadNotificationCount(createdBy) {
  const db = await safeGetDb();
  if (!db) return 0;

  try {
    const result = createdBy
      ? await db.query(
          `SELECT COUNT(*) as count FROM notification_log WHERE is_read = 0 AND created_by = ?`,
          [createdBy]
        )
      : await db.query(
          `SELECT COUNT(*) as count FROM notification_log WHERE is_read = 0`
        );
    return result.values?.[0]?.count ?? 0;
  } catch (e) {
    return 0;
  }
}

export async function getLocalNotifications(createdBy, limit = 50) {
  const db = await safeGetDb();
  if (!db) return [];

  try {
    const result = createdBy
      ? await db.query(
          `SELECT * FROM notification_log WHERE created_by = ? ORDER BY created_at DESC LIMIT ?`,
          [createdBy, limit]
        )
      : await db.query(
          `SELECT * FROM notification_log ORDER BY created_at DESC LIMIT ?`,
          [limit]
        );
    const rows = result.values || [];
    return rows.map(r => ({
      ...r,
      is_read: r.is_read === 1 || r.is_read === true,
    }));
  } catch (e) {
    return [];
  }
}

export async function markNotificationRead(id) {
  const db = await safeGetDb();
  if (!db) return;

  try {
    await db.run(
      `UPDATE notification_log SET is_read = 1 WHERE id = ?`,
      [id]
    );
  } catch (e) {
    console.warn('[genericRepository] markNotificationRead failed:', e);
  }
}

export async function markAllNotificationsRead(createdBy) {
  const db = await safeGetDb();
  if (!db) return;

  try {
    if (createdBy) {
      await db.run(`UPDATE notification_log SET is_read = 1 WHERE created_by = ?`, [createdBy]);
    } else {
      await db.run(`UPDATE notification_log SET is_read = 1`);
    }
  } catch (e) {
    console.warn('[genericRepository] markAllNotificationsRead failed:', e);
  }
}

export async function deleteNotificationLog(id) {
  const db = await safeGetDb();
  if (!db) return;

  try {
    await db.run(`DELETE FROM notification_log WHERE id = ?`, [id]);
  } catch (e) {
    console.warn('[genericRepository] deleteNotificationLog failed:', e);
  }
}

export async function clearAllNotificationLogs(createdBy) {
  const db = await safeGetDb();
  if (!db) return;

  try {
    if (createdBy) {
      await db.run(`DELETE FROM notification_log WHERE created_by = ?`, [createdBy]);
    } else {
      await db.run(`DELETE FROM notification_log`);
    }
  } catch (e) {
    console.warn('[genericRepository] clearAllNotificationLogs failed:', e);
  }
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function setProfileValue(key, value) {
  const db = await safeGetDb();
  if (!db) return;

  const now = new Date().toISOString();

  try {
    await db.run(
      `INSERT OR REPLACE INTO profile (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, now]
    );
  } catch (e) {
    console.warn('[genericRepository] setProfileValue failed:', e);
  }
}

export async function getProfileValue(key) {
  const db = await safeGetDb();
  if (!db) return null;

  try {
    const result = await db.query(
      `SELECT value FROM profile WHERE key = ?`,
      [key]
    );
    return result.values?.[0]?.value ?? null;
  } catch (e) {
    return null;
  }
}

export async function getAllProfileValues() {
  const db = await safeGetDb();
  if (!db) return {};

  try {
    const result = await db.query(`SELECT key, value FROM profile`);
    const rows = result.values || [];
    return rows.reduce((acc, r) => {
      acc[r.key] = r.value;
      return acc;
    }, {});
  } catch (e) {
    return {};
  }
}


// ─── Bulk Delete Functions (used by Delete Account) ───────────────────────────

export async function deleteAllLocalTransactions() {
  const db = await safeGetDb();
  if (!db) return;
  try { await db.run(`DELETE FROM transactions`); } catch (e) {}
}

export async function deleteAllLocalSavingsGoals() {
  const db = await safeGetDb();
  if (!db) return;
  try { await db.run(`DELETE FROM savings_goals`); } catch (e) {}
}

export async function deleteAllLocalExpenseLimits() {
  const db = await safeGetDb();
  if (!db) return;
  try { await db.run(`DELETE FROM expense_limits`); } catch (e) {}
}

export async function deleteAllLocalRenewals() {
  const db = await safeGetDb();
  if (!db) return;
  try { await db.run(`DELETE FROM renewal_reminders`); } catch (e) {}
}

export async function deleteAllLocalMaintenance() {
  const db = await safeGetDb();
  if (!db) return;
  try { await db.run(`DELETE FROM maintenance`); } catch (e) {}
}

export async function deleteAllLocalProfile() {
  const db = await safeGetDb();
  if (!db) return;
  try { await db.run(`DELETE FROM profile`); } catch (e) {}
}
