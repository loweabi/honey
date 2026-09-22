import type { ConfirmSaleInput, ConfirmSaleResult } from '../db/sales';

const DB_NAME = 'honey-offline';
const DB_VERSION = 1;
const CACHE = 'cache';
const QUEUE = 'saleQueue';

type QueueItem = { id: string; input: ConfirmSaleInput; createdAt: string; status: 'pending' | 'failed'; error?: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CACHE)) db.createObjectStore(CACHE);
      if (!db.objectStoreNames.contains(QUEUE)) db.createObjectStore(QUEUE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(store: string, key: string, value: unknown) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function get<T>(store: string, key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => { db.close(); resolve((req.result as T) ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function all<T>(store: string): Promise<T[]> {
  const db = await openDb();
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => { db.close(); resolve((req.result as T[]) ?? []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function cacheData<T>(key: string, value: T) { await put(CACHE, key, value); }
export async function readCache<T>(key: string) { return get<T>(CACHE, key); }

export async function enqueueSale(input: ConfirmSaleInput): Promise<string> {
  const id = crypto.randomUUID();
  await put(QUEUE, id, { id, input, createdAt: new Date().toISOString(), status: 'pending' } satisfies QueueItem);
  return id;
}

export async function pendingSaleCount() {
  const items = await all<QueueItem>(QUEUE);
  return items.filter((x) => x.status === 'pending').length;
}

export async function syncQueuedSales(send: (input: ConfirmSaleInput) => Promise<ConfirmSaleResult>) {
  const items = (await all<QueueItem>(QUEUE)).filter((x) => x.status === 'pending');
  for (const item of items) {
    try {
      await send(item.input);
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(QUEUE, 'readwrite');
        tx.objectStore(QUEUE).delete(item.id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (error) {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(QUEUE, 'readwrite');
        tx.objectStore(QUEUE).put({ ...item, status: 'failed', error: error instanceof Error ? error.message : 'Sync failed' });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    }
  }
}

export function isOffline() { return typeof navigator !== 'undefined' && !navigator.onLine; }
