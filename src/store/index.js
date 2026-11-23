import { configureStore } from '@reduxjs/toolkit'
import marketReducer from './slices/marketSlice'
import watchlistReducer from './slices/watchlistSlice'
import tradingReducer from './slices/tradingSlice'
import portfolioReducer from './slices/portfolioSlice'
import alertsReducer from './slices/alertsSlice'
import settingsReducer from './slices/settingsSlice'
import terminalReducer from './slices/terminalSlice'
import screenerReducer from './slices/screenerSlice'
import { idbPut, idbGetAll } from '@/lib/idb'

const IDB_STORE_MAP = {
  watchlist: 'watchlists',
  alerts: 'alerts',
  portfolio: 'portfolios',
  trading: 'trading',
  settings: 'settings',
}

/**
 * Hydrate persisted state from IndexedDB (falls back to slice-level localStorage).
 * Runs once before the store is used by components.
 */
async function hydrateFromIndexedDB() {
  const preloadedState = {}
  for (const [sliceKey, idbStore] of Object.entries(IDB_STORE_MAP)) {
    try {
      const rows = await idbGetAll(idbStore)
      if (rows && rows.length > 0) {
        const row = rows.find((r) => r.key === sliceKey) || rows[0]
        if (row && row.value) {
          preloadedState[sliceKey] = row.value
        }
      }
    } catch (e) {
      console.warn(`[IndexedDB] Hydration failed for ${sliceKey}:`, e)
    }
  }
  return preloadedState
}

export async function initializeStore() {
  const preloadedState = await hydrateFromIndexedDB()
  return createStore(preloadedState)
}

function createStore(preloadedState) {
  const appStore = configureStore({
    reducer: {
      market: marketReducer,
      watchlist: watchlistReducer,
      trading: tradingReducer,
      portfolio: portfolioReducer,
      alerts: alertsReducer,
      settings: settingsReducer,
      terminal: terminalReducer,
      screener: screenerReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/REHYDRATE'],
        },
      }),
    devTools: true,
  })

  let lastPersisted = {}
  appStore.subscribe(() => {
      const state = appStore.getState()
      const changed = {}
      for (const [sliceKey, idbStore] of Object.entries(IDB_STORE_MAP)) {
        const value = state[sliceKey]
        if (JSON.stringify(value) !== JSON.stringify(lastPersisted[sliceKey])) {
          changed[idbStore] = { id: sliceKey, key: sliceKey, value, updatedAt: Date.now() }
          lastPersisted[sliceKey] = value
        }
      }
      if (Object.keys(changed).length > 0) {
        ;(async () => {
          for (const [idbStore, entry] of Object.entries(changed)) {
            try {
              await idbPut(idbStore, entry)
            } catch (error) {
              console.warn(`[IndexedDB] Persist failed for ${idbStore}:`, error)
            }
          }
        })()
      }
  })

  return appStore
}

/**
 * Synchronous store export for immediate use (fallback to slice-level localStorage).
 * IndexedDB hydration happens asynchronously via initializeStore().
 */
export const store = createStore()

export default store
