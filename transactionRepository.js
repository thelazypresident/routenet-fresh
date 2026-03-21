import { safeGetDb } from "./db";

// FIX: Removed WHERE created_by = ? from all READ functions.
//
// Root cause confirmed via Android logcat (2026-03-16):
//   - Every INSERT stores created_by = "" (empty string) because
//     base44.auth.me() times out on device boot, AppContext.user is null,
//     and pages pass user?.email || "" to the repository.
//   - Every SELECT queries WHERE created_by = 'actual@email.com'
//   - "" never matches 'actual@email.com' → reads always return [] → pages empty
//
// This is a single-user device. There is only one user's data in SQLite.
// The created_by filter is unnecessary and was the root cause of every
// "data not appearing" bug across Dashboard, Transactions, and all other pages.
//
// Writes are unchanged — created_by is still stored for sync purposes.
// Only reads are fixed.

/**
 * CREATE: Saves a new transaction to the local phone database.
 */
export async function createLocalTransaction(data) {
  const db = await safeGetDb();
  if (!db) throw new Error("Database not available");

  const query = `
    INSERT INTO transactions (
      id,
      remote_id,
      type,
      category,
      amount,
      date,
      transaction_date,
      platform,
      description,
      period,
      created_by,
      created_at,
      updated_at,
      sync_status,
      sync_error
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    data.remote_id ?? null,
    data.type ?? "",
    data.category ?? "",
    data.amount ?? 0,
    data.date ?? new Date().toISOString(),
    data.transaction_date ?? new Date().toISOString(),
    data.platform ?? "",
    data.description ?? "",
    data.period ?? "daily",
    data.created_by ?? "",
    data.created_at ?? new Date().toISOString(),
    data.updated_at ?? new Date().toISOString(),
    "pending",
    null
  ];

  await db.run(query, values);
  return data;
}

/**
 * UPDATE: Updates an existing transaction on the phone.
 */
export async function updateLocalTransaction(id, data) {
  const db = await safeGetDb();
  if (!db) throw new Error("Database not available");

  const query = `
    UPDATE transactions
    SET
      type = ?,
      category = ?,
      amount = ?,
      date = ?,
      transaction_date = ?,
      platform = ?,
      description = ?,
      period = ?,
      updated_at = ?,
      sync_status = 'pending',
      sync_error = NULL
    WHERE id = ?
  `;

  const values = [
    data.type ?? "",
    data.category ?? "",
    data.amount ?? 0,
    data.date ?? null,
    data.transaction_date ?? null,
    data.platform ?? "",
    data.description ?? "",
    data.period ?? "daily",
    new Date().toISOString(),
    id
  ];

  await db.run(query, values);
}

/**
 * DELETE: Removes a transaction from the local database immediately.
 */
export async function deleteLocalTransaction(id) {
  const db = await safeGetDb();
  if (!db) throw new Error("Database not available");

  await db.run(
    `DELETE FROM transactions WHERE id = ?`,
    [id]
  );
}

/**
 * READ ALL: Gets all transactions.
 * FIX: Removed WHERE created_by = ? — single-user device, filter was wrong.
 * createdBy param kept for API compatibility but no longer used in query.
 */
export async function getLocalTransactions(createdBy) {
  const db = await safeGetDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC`
  );
  return result.values || [];
}

/**
 * READ ONE (Local ID)
 */
export async function getTransactionById(id) {
  const db = await safeGetDb();
  if (!db) return null;

  const result = await db.query(
    `SELECT * FROM transactions WHERE id = ?`,
    [id]
  );
  return result.values?.[0] || null;
}

/**
 * READ ONE (Remote ID)
 */
export async function getTransactionByRemoteId(remoteId) {
  const db = await safeGetDb();
  if (!db) return null;

  const result = await db.query(
    `SELECT * FROM transactions WHERE remote_id = ?`,
    [remoteId]
  );
  return result.values?.[0] || null;
}

/**
 * SYNC HELPER: Gets all items that need to be uploaded to the server.
 * FIX: Also removed created_by filter here — pending rows must be synced
 * regardless of what email was stored at write time.
 */
export async function getPendingTransactions(createdBy) {
  const db = await safeGetDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM transactions
     WHERE sync_status != 'synced'
     ORDER BY updated_at ASC, created_at ASC`
  );
  return result.values || [];
}

/**
 * SYNC SUCCESS: Marks a transaction as 'synced'.
 */
export async function markTransactionSynced(localId, remoteId = null) {
  const db = await safeGetDb();
  if (!db) throw new Error("Database not available");

  await db.run(
    `UPDATE transactions
     SET remote_id = COALESCE(?, remote_id),
         sync_status = 'synced',
         sync_error = NULL
     WHERE id = ?`,
    [remoteId, localId]
  );
}

/**
 * SYNC FAILURE: Marks a transaction as 'failed'.
 */
export async function markTransactionFailed(localId, error) {
  const db = await safeGetDb();
  if (!db) throw new Error("Database not available");

  const errorText =
    typeof error === "string"
      ? error
      : error?.message || JSON.stringify(error || "Unknown sync error");

  await db.run(
    `UPDATE transactions
     SET sync_status = 'failed', sync_error = ?
     WHERE id = ?`,
    [errorText, localId]
  );
}

/**
 * UPSERT: When data comes FROM the server, update local copy or create new.
 */
export async function upsertServerTransaction(serverTx) {
  const db = await safeGetDb();
  if (!db) throw new Error("Database not available");

  const existing = await getTransactionByRemoteId(serverTx.id);

  if (existing) {
    await db.run(
      `UPDATE transactions
       SET type = ?, category = ?, amount = ?, date = ?, transaction_date = ?,
           platform = ?, description = ?, period = ?, created_by = ?,
           created_at = ?, updated_at = ?, sync_status = 'synced', sync_error = NULL
       WHERE remote_id = ?`,
      [
        serverTx.type ?? "",
        serverTx.category ?? "",
        serverTx.amount ?? 0,
        serverTx.date ?? null,
        serverTx.transaction_date ?? null,
        serverTx.platform ?? "",
        serverTx.description ?? "",
        serverTx.period ?? "daily",
        serverTx.created_by ?? "",
        serverTx.created_at ?? new Date().toISOString(),
        serverTx.updated_at ?? new Date().toISOString(),
        serverTx.id
      ]
    );
    return existing.id;
  }

  const localId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await db.run(
    `INSERT INTO transactions (
       id, remote_id, type, category, amount, date, transaction_date,
       platform, description, period, created_by, created_at, updated_at,
       sync_status, sync_error
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      localId,
      serverTx.id,
      serverTx.type ?? "",
      serverTx.category ?? "",
      serverTx.amount ?? 0,
      serverTx.date ?? null,
      serverTx.transaction_date ?? null,
      serverTx.platform ?? "",
      serverTx.description ?? "",
      serverTx.period ?? "daily",
      serverTx.created_by ?? "",
      serverTx.created_at ?? new Date().toISOString(),
      serverTx.updated_at ?? new Date().toISOString(),
      "synced",
      null
    ]
  );

  return localId;
}
