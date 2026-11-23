import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 1023px)')
}
