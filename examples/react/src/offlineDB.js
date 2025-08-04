import { openDB } from 'idb';

const DB_NAME = 'speedyinfra-offline';
const DB_VERSION = 3;

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
    if (db.objectStoreNames.contains('sync-queue')) {
      db.deleteObjectStore('sync-queue');
    }
    if (!db.objectStoreNames.contains('_users')) {
      const userStore = db.createObjectStore('_users', { keyPath: '_id' });
      userStore.createIndex('by_email', 'email', { unique: true });
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

function generateId() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function addUser(user) {
  const db = await dbPromise;
  // NOTE: This is a mock user record for offline. `_id` should ideally be consistent with backend.
  const userWithId = { ...user, _id: user._id || generateId() };
  await db.put('_users', userWithId);
  return userWithId;
}

export async function getUserByEmail(email) {
  const db = await dbPromise;
  return db.getFromIndex('_users', 'by_email', email);
}

export async function getUserById(id) {
  const db = await dbPromise;
  return db.get('_users', id);
}

export async function updateUserById(id, updates) {
  const db = await dbPromise;
  const user = await db.get('_users', id);
  if (user) {
    // Exclude password from updates unless explicitly provided
    const { password, ...restOfUpdates } = updates;
    const updatedUser = { ...user, ...restOfUpdates, updatedAt: new Date() };
    if (password) {
      updatedUser.password = password;
    }
    await db.put('_users', updatedUser);
    return updatedUser;
  }
  return null;
}

export async function deleteUserById(id) {
  const db = await dbPromise;
  await db.delete('_users', id);
}


// Table functions for offline mutations
export async function addTableItem(tableName, item) {
  const db = await dbPromise;
  const newItem = { ...item, _id: generateId(), createdAt: new Date() };
  await db.put('tables', { ...newItem, tableName, id: `${tableName}-${newItem._id}` });
  return newItem;
}

export async function updateTableItem(tableName, id, item) {
  const db = await dbPromise;
  const existing = await db.get('tables', `${tableName}-${id}`);
  if (existing) {
    const updatedItem = { ...existing, ...item, updatedAt: new Date() };
    await db.put('tables', updatedItem);
    return 1;
  }
  return 0;
}

export async function deleteTableItem(tableName, id) {
  const db = await dbPromise;
  const key = `${tableName}-${id}`;
  if (await db.get('tables', key)) {
    await db.delete('tables', key);
    return 1;
  }
  return 0;
}

async function getFilteredItems(tableName, query) {
  const db = await dbPromise;
  let items = await db.getAllFromIndex('tables', 'by_table', tableName);

  if (query) {
    const filterPredicates = [];
    for (const key in query) {
      if (key.startsWith('_')) continue;
      const value = query[key];

      if (key.endsWith('_gte')) {
        const field = key.slice(0, -4);
        filterPredicates.push(item => item[field] >= parseFloat(value));
      } else if (key.endsWith('_lte')) {
        const field = key.slice(0, -4);
        filterPredicates.push(item => item[field] <= parseFloat(value));
      } else if (key.endsWith('_ne')) {
        const field = key.slice(0, -3);
        filterPredicates.push(item => String(item[field]) !== String(value));
      } else {
        filterPredicates.push(item => String(item[key]) === String(value));
      }
    }

    if (filterPredicates.length > 0) {
      items = items.filter(item => filterPredicates.every(p => p(item)));
    }
  }

  return items;
}

export async function queryTable(tableName, query) {
  let items = await getFilteredItems(tableName, query);
  const totalCount = items.length;

  const page = parseInt(query._page, 10) || 1;
  const limit = parseInt(query._limit, 10) || Infinity;
  const sortField = query._sort;
  const sortOrder = query._order === 'desc' ? -1 : 1;

  if (sortField) {
    items.sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1 * sortOrder;
      if (a[sortField] > b[sortField]) return 1 * sortOrder;
      return 0;
    });
  }

  const paginatedItems = limit === Infinity ? items : items.slice((page - 1) * limit, page * limit);

  return { data: paginatedItems, totalCount };
}

export async function clearAllData() {
  const db = await dbPromise;
  await Promise.all([
    db.clear('tables'),
    db.clear('files'),
    db.clear('file-blobs'),
    db.clear('_users'),
  ]);
}

export async function countTableItems(tableName, query) {
  const items = await getFilteredItems(tableName, query);
  return items.length;
}

export async function updateTableItemsByQuery(tableName, query, updates) {
  const db = await dbPromise;
  const itemsToUpdate = await getFilteredItems(tableName, query);

  const tx = db.transaction('tables', 'readwrite');
  for (const item of itemsToUpdate) {
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    await tx.store.put(updatedItem);
  }
  await tx.done;
  return itemsToUpdate.length;
}

export async function deleteTableItemsByQuery(tableName, query) {
  const db = await dbPromise;
  const itemsToDelete = await getFilteredItems(tableName, query);

  const tx = db.transaction('tables', 'readwrite');
  for (const item of itemsToDelete) {
    await tx.store.delete(item.id);
  }
  await tx.done;
  return itemsToDelete.length;
}
