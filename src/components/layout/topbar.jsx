'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, Globe2, Menu, Monitor, Moon, Search, Sun } from 'lucide-react'
import { selectSettings } from '@/store/selectors'
import { setActiveWorkspace, setDefaultExchange, setTheme } from '@/store/slices/settingsSlice'

export default function Topbar({ setSearchOpen, onMenu }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const settings = useSelector(selectSettings)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [time, setTime] = useState('--:--')
  const [marketOpen, setMarketOpen] = useState(false)

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const parts = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now)
      const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
      const minutes = Number(values.hour) * 60 + Number(values.minute)
      const weekday = !['Sat', 'Sun'].includes(values.weekday)
      setTime(`${values.hour}:${values.minute} IST`)
      setMarketOpen(weekday && minutes >= 555 && minutes < 930)
    }
    updateClock()
    const interval = window.setInterval(updateClock, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const openSearchShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', openSearchShortcut)
    return () => window.removeEventListener('keydown', openSearchShortcut)
  }, [setSearchOpen])

  const activeWorkspace = settings.workspaces?.find((workspace) => workspace.id === settings.activeWorkspace)
  const toggleTheme = () => dispatch(setTheme(settings.theme === 'light' ? 'dark' : 'light'))

  return (
    <header className="topbar sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button aria-label="Open navigation" className="rounded-xl p-2 text-muted hover:bg-panel-hover hover:text-foreground lg:hidden" onClick={onMenu}><Menu size={19} /></button>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.17em] text-muted">Markets · NSE / BSE</p>
          <p className="mt-0.5 text-xs font-semibold tracking-tight">Financial intelligence workspace</p>
        </div>
        <button aria-label="Search stocks and modules" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-panel text-muted hover:border-accent/50 hover:text-accent sm:hidden" onClick={() => setSearchOpen(true)}><Search size={17} /></button>
        <button className="input hidden h-10 w-64 items-center gap-2 rounded-xl px-3 text-left text-xs text-muted transition hover:border-accent/50 md:flex xl:w-80" onClick={() => setSearchOpen(true)}>
          <Search size={15} />
          <span className="flex-1">Search stocks, modules…</span>
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[9px]">Ctrl K</kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 md:flex">
          <span className={marketOpen ? 'h-2 w-2 rounded-full bg-positive shadow-[0_0_10px_var(--positive)]' : 'h-2 w-2 rounded-full bg-muted'} />
          <span className="text-[10px] font-semibold">{marketOpen ? 'Market open' : 'Market closed'}</span>
          <span className="border-l border-border pl-2 font-mono text-[9px] text-muted">{time}</span>
        </div>

        <div className="relative">
          <button aria-label={`Exchange ${settings.defaultExchange}`} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-panel px-3 text-[11px] font-semibold hover:bg-panel-hover" onClick={() => dispatch(setDefaultExchange(settings.defaultExchange === 'NSE' ? 'BSE' : 'NSE'))}>
            <Globe2 size={14} className="text-muted" /><span>{settings.defaultExchange}</span><ChevronDown size={12} className="text-muted" />
          </button>
        </div>

        <div className="relative">
          <button aria-expanded={workspaceOpen} className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-panel px-3 text-[11px] font-semibold hover:bg-panel-hover sm:flex" onClick={() => setWorkspaceOpen((open) => !open)}>
            <Monitor size={14} className="text-accent" /><span className="max-w-28 truncate">{activeWorkspace?.name || 'Workspace'}</span><ChevronDown size={12} className="text-muted" />
          </button>
          {workspaceOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-border bg-panel p-2 shadow-2xl">
              <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.17em] text-muted">Switch workspace</p>
              {(settings.workspaces || []).map((workspace) => (
                <button key={workspace.id} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs hover:bg-panel-hover" onClick={() => { dispatch(setActiveWorkspace(workspace.id)); setWorkspaceOpen(false) }}>
                  <span>{workspace.name}</span>
                  {settings.activeWorkspace === workspace.id && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>
              ))}
              <button className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-xs text-muted hover:text-foreground" onClick={() => { router.push('/settings'); setWorkspaceOpen(false) }}>Manage workspaces</button>
            </div>
          )}
        </div>

        <button aria-label={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} theme`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-panel text-muted hover:text-accent" onClick={toggleTheme}>
          {settings.theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button aria-label="Open alerts center" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-panel text-muted hover:text-accent" onClick={() => router.push('/alerts-center')}>
          <Bell size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[10px] font-bold text-accent sm:flex">DT</div>
      </div>
    </header>
  )
}
