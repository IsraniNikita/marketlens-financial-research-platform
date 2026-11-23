'use client'

import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { initializeStore } from '@/store'

export default function StoreProvider({ children }) {
  const [store, setStore] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    initializeStore().then((initializedStore) => {
      if (active) setStore(initializedStore)
    }).catch((storeError) => {
      console.error('[Store] Failed to initialize application state:', storeError)
      if (active) setError(storeError)
    })
    return () => { active = false }
  }, [])

  if (error) {
    return <div role="alert" className="p-8 text-sm text-negative">Could not load the demo workspace. Refresh the page to try again.</div>
  }
  if (!store) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading your workspace…</div>
  }
  return <Provider store={store}>{children}</Provider>
}
