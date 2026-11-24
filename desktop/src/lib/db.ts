/**
 * Versioned SQLite persistence layer (via tauri-plugin-sql)
 * with transparent localStorage fallback for browser/Vitest/Playwright environments.
 */
import { isTauriRuntime } from "./tauri";

const CURRENT_SCHEMA_VERSION = 1;
const LS_PREFIX = "quranic.kv.";

interface SqlDatabase {
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
}

let dbPromise: Promise<SqlDatabase | null> | null = null;

async function getSqliteDb(): Promise<SqlDatabase | null> {
  if (!isTauriRuntime()) return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = (await Database.load("sqlite:quranic.db")) as unknown as SqlDatabase;
        await runMigrations(db);
        return db;
      } catch (err) {
        console.warn("[db] Falling back to localStorage:", err);
        return null;
      }
    })();
  }
  return dbPromise;
}

async function runMigrations(db: SqlDatabase): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const rows = await db.select<{ version: number }[]>(
    "SELECT MAX(version) as version FROM schema_migrations",
  );
  const currentVersion = rows[0]?.version ?? 0;

  if (currentVersion < 1) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    await db.execute(
      "INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES ($1, $2)",
      [CURRENT_SCHEMA_VERSION, new Date().toISOString()],
    );
  }
}

export async function dbGet<T>(key: string, fallback: T): Promise<T> {
  const db = await getSqliteDb();
  if (db) {
    try {
      const rows = await db.select<{ value: string }[]>(
        "SELECT value FROM kv_store WHERE key = $1",
        [key],
      );
      if (rows[0]?.value) {
        return JSON.parse(rows[0].value) as T;
      }
    } catch (err) {
      console.warn(`[db] Failed to read ${key}:`, err);
    }
  }
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
}

export async function dbSet<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LS_PREFIX + key, serialized);
    } catch {
      // Ignore quota errors in browser fallback
    }
  }
  const db = await getSqliteDb();
  if (db) {
    try {
      await db.execute(
        "INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES ($1, $2, $3)",
        [key, serialized, new Date().toISOString()],
      );
    } catch (err) {
      console.warn(`[db] Failed to write ${key}:`, err);
    }
  }
}

export async function dbDelete(key: string): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LS_PREFIX + key);
  }
  const db = await getSqliteDb();
  if (db) {
    try {
      await db.execute("DELETE FROM kv_store WHERE key = $1", [key]);
    } catch (err) {
      console.warn(`[db] Failed to delete ${key}:`, err);
    }
  }
}

export async function dbClearAll(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(LS_PREFIX) || k.startsWith("quranic."))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
  const db = await getSqliteDb();
  if (db) {
    try {
      await db.execute("DELETE FROM kv_store");
    } catch (err) {
      console.warn("[db] Failed to clear kv_store:", err);
    }
  }
}
