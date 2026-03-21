import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'routenet_db';
let db = null;

export async function initDB() {
  if (db) return db;

  if (!window.Capacitor?.isNativePlatform?.()) {
    console.warn('[DB] Not a native platform, skipping SQLite init');
    return null;
  }

  try {
    await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (isConn) {
      db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await db.open();
    await runMigrations();
    console.log('[DB] SQLite ready ✅');
    return db;
  } catch (err) {
    console.error('[DB] Init error:', err);
    throw err;
  }
}

async function runMigrations() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entity      TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      operation   TEXT NOT NULL,
      payload     TEXT,
      synced_at   TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS routes (
      id         TEXT PRIMARY KEY,
      name       TEXT,
      data       TEXT,
      updated_at TEXT,
      synced     INTEGER DEFAULT 0
    );
  `);
}

export async function getDB() {
  if (db) return db;
  return initDB();
}
