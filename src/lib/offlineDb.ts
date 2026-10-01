const DB_NAME = "pdf-reader-offline";
const DB_VERSION = 2;
export const PDF_STORE = "pdfs";
export const META_STORE = "meta";
export const RENDER_STORE = "renders";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB tidak tersedia"));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PDF_STORE)) db.createObjectStore(PDF_STORE);
        if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
        if (!db.objectStoreNames.contains(RENDER_STORE)) db.createObjectStore(RENDER_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const idbGet = <T>(store: string, key: string) =>
  run<T | undefined>(store, "readonly", (s) => s.get(key));
export const idbPut = (store: string, key: string, value: unknown) =>
  run<IDBValidKey>(store, "readwrite", (s) => s.put(value, key));
export const idbDelete = (store: string, key: string) =>
  run<undefined>(store, "readwrite", (s) => s.delete(key));
export const idbKeys = (store: string) =>
  run<IDBValidKey[]>(store, "readonly", (s) => s.getAllKeys());
