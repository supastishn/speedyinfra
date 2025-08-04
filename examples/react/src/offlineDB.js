import { openDB } from 'idb';

const DB_NAME = 'speedyinfra-offline';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('tables')) {
      const tableStore = db.createObjectStore('tables', { keyPath: 'id' });
      tableStore.createIndex('by_table', 'tableName');
    }
    if (!db.objectStoreNames.contains('files')) {
      const fileStore = db.createObjectStore('files', { keyPath: 'filename' });
      fileStore.createIndex('by_project', 'projectName');
    }
    if (!db.objectStoreNames.contains('file-blobs')) {
      db.createObjectStore('file-blobs', { keyPath: 'filename' });
    }
    if (!db.objectStoreNames.contains('sync-queue')) {
      db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
    }
  },
});

export async function getOfflineTableCache(tableName) {
  const db = await dbPromise;
  const items = await db.getAllFromIndex('tables', 'by_table', tableName);
  return items;
}

export async function getOfflineTableItemCache(tableName, documentId) {
  const db = await dbPromise;
  return db.get('tables', `${tableName}-${documentId}`);
}

export async function setOfflineTableCache(tableName, data) {
  const db = await dbPromise;
  const tx = db.transaction('tables', 'readwrite');
  const store = tx.objectStore('tables');
  const oldKeys = await store.index('by_table').getAllKeys(tableName);
  for (const key of oldKeys) {
    await store.delete(key);
  }
  for (const item of data) {
    if (item._id) {
      await store.put({ ...item, tableName, id: `${tableName}-${item._id}` });
    }
  }
  await tx.done;
}

export async function setOfflineTableItemCache(tableName, item) {
  const db = await dbPromise;
  const tx = db.transaction('tables', 'readwrite');
  if (item._id) {
    await tx.store.put({ ...item, tableName, id: `${tableName}-${item._id}` });
  }
  await tx.done;
}

export async function getOfflineFilesCache(projectName) {
  const db = await dbPromise;
  const files = await db.getAllFromIndex('files', 'by_project', projectName);
  return files.map((f) => f.filename);
}

export async function setOfflineFilesCache(projectName, files) {
  const db = await dbPromise;
  const tx = db.transaction('files', 'readwrite');
  const oldFiles = await tx.store.index('by_project').getAll(projectName);
  for (const file of oldFiles) {
    await tx.store.delete(file.filename);
  }
  for (const filename of files) {
    await tx.store.put({ projectName, filename });
  }
  await tx.done;
}

export async function getOfflineFileBlob(filename) {
  const db = await dbPromise;
  const result = await db.get('file-blobs', filename);
  return result ? result.blob : null;
}

export async function setOfflineFileBlob(filename, blob) {
  const db = await dbPromise;
  const tx = db.transaction('file-blobs', 'readwrite');
  await tx.store.put({ filename, blob });
  await tx.done;
}

export async function removeOfflineFileFromCache(filename) {
  const db = await dbPromise;
  const tx = db.transaction(['files', 'file-blobs'], 'readwrite');
  await tx.objectStore('files').delete(filename);
  await tx.objectStore('file-blobs').delete(filename);
  await tx.done;
}

export async function addSyncQueue(operation) {
  const db = await dbPromise;
  await db.add('sync-queue', operation);
}

export async function getSyncQueue() {
  const db = await dbPromise;
  return db.getAll('sync-queue');
}

export async function removeSyncQueueItem(id) {
  const db = await dbPromise;
  await db.delete('sync-queue', id);
}
