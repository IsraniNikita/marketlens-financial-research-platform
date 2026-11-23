import { openDB } from 'idb'

const DB_NAME = 'financial-platform-db'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('watchlists')) {
          db.createObjectStore('watchlists', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('portfolios')) {
          db.createObjectStore('portfolios', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('trading')) {
          db.createObjectStore('trading', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function idbGet(storeName, key) {
  const db = await getDB()
  return db.get(storeName, key)
}

export async function idbGetAll(storeName) {
  const db = await getDB()
  return db.getAll(storeName)
}

export async function idbPut(storeName, value) {
  const db = await getDB()
  return db.put(storeName, value)
}

export async function idbDelete(storeName, key) {
  const db = await getDB()
  return db.delete(storeName, key)
}

export async function idbClear(storeName) {
  const db = await getDB()
  return db.clear(storeName)
}

export default { idbGet, idbGetAll, idbPut, idbDelete, idbClear }
