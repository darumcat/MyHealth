
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'MyHealthPledgeDB';
const STORE_NAME = 'data';
const KEY = 'encryptedData';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

async function saveEncryptedData(encryptedData: string): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, encryptedData, KEY);
}

async function getEncryptedData(): Promise<string | undefined> {
  const db = await getDb();
  return await db.get(STORE_NAME, KEY);
}

async function hasData(): Promise<boolean> {
  const data = await getEncryptedData();
  return !!data;
}

async function clearData(): Promise<void> {
    const db = await getDb();
    await db.clear(STORE_NAME);
}

export const dbService = {
  saveEncryptedData,
  getEncryptedData,
  hasData,
  clearData,
};