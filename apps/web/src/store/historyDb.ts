import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { HistorySnapshot } from './historyTypes';

interface HistoryDB extends DBSchema {
  history: {
    key: string;
    value: HistorySnapshot;
  };
  draft: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'wemd-history';
const DB_VERSION = 2;
const HISTORY_LIMIT = 30;

let dbPromise: Promise<IDBPDatabase<HistoryDB>> | null = null;

async function getDB() {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is not available in SSR');
  }
  if (!dbPromise) {
    dbPromise = openDB<HistoryDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('history');
        }
        if (oldVersion === 1) {
          if (db.objectStoreNames.contains('draft')) {
            db.deleteObjectStore('draft');
          }
          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history');
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function loadHistoryFromDb() {
  try {
    const db = await getDB();
    const history = (await db.getAll('history')).map((entry) => ({
      ...entry,
      title: entry.title || '未命名文章',
      createdAt: entry.createdAt || entry.savedAt,
      filePath: entry.filePath,
    }));
    history.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return history;
  } catch (error) {
    console.error('[HistoryDB] load failed', error);
    return [];
  }
}

export async function addHistoryToDb(snapshot: HistorySnapshot) {
  try {
    const db = await getDB();
    await db.put('history', snapshot, snapshot.id);
    const tx = db.transaction('history', 'readwrite');
    const store = tx.store;
    const all = await store.getAll();
    if (all.length > HISTORY_LIMIT) {
      all.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
      const overflow = all.slice(0, all.length - HISTORY_LIMIT);
      for (const entry of overflow) {
        await store.delete(entry.id);
      }
    }
    await tx.done;
  } catch (error) {
    console.error('[HistoryDB] add history failed', error);
  }
}

export async function deleteHistoryFromDb(id: string) {
  try {
    const db = await getDB();
    await db.delete('history', id);
  } catch (error) {
    console.error('[HistoryDB] delete failed', error);
  }
}

export async function updateHistoryInDb(entry: HistorySnapshot) {
  try {
    const db = await getDB();
    await db.put('history', entry, entry.id);
  } catch (error) {
    console.error('[HistoryDB] update failed', error);
  }
}

export async function clearHistoryDb() {
  try {
    const db = await getDB();
    await db.clear('history');
  } catch (error) {
    console.error('[HistoryDB] clear failed', error);
  }
}
