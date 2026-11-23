'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectSettings } from '@/store/selectors'
import { hydrateSettings } from '@/store/slices/settingsSlice'

export default function ThemeProvider({ children }) {
  const dispatch = useDispatch()
  const { theme, hydrated } = useSelector(selectSettings)

  useEffect(() => {
    let savedSettings = {}
    let savedTheme = 'dark'
    try {
      const saved = localStorage.getItem('fp-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) savedSettings = parsed
      }
      savedTheme = localStorage.getItem('fp-theme') || 'dark'
    } catch (error) {
      console.warn('[Settings] Failed to load saved preferences:', error)
    }
    dispatch(hydrateSettings({
      ...savedSettings,
      theme: savedSettings.theme || savedTheme || 'dark',
    }))
  }, [dispatch])

  useEffect(() => {
    if (!hydrated) return
    const root = document.documentElement
    if (theme === 'light') root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
    try {
      localStorage.setItem('fp-theme', theme)
    } catch (error) {
      console.warn('[Settings] Failed to save theme preference:', error)
    }
  }, [theme, hydrated])

  return children
}
