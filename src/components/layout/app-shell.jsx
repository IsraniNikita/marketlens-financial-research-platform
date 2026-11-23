'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { ArrowUpRight, Command, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectStocks } from '@/store/selectors'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import Sidebar from './sidebar'
import Topbar from './topbar'

const MODULES = [
  ['Market Overview', '/market-overview', 'Market-wide intelligence'],
  ['Market Explorer', '/market-explorer', 'Explore stocks and assets'],
  ['Company Research', '/company-research', 'Detailed company analysis'],
  ['Stock Comparison', '/stock-comparison', 'Compare multiple assets'],
  ['Trading Terminal', '/trading-terminal', 'Advanced chart workspace'],
  ['Technical Analysis', '/technical-analysis', 'Indicators and patterns'],
  ['Watchlists', '/watchlists', 'Track selected assets'],
  ['Paper Trading', '/paper-trading', 'Simulated buy and sell'],
  ['Portfolio Manager', '/portfolio-manager', 'Virtual holdings and P&L'],
  ['Risk Analytics', '/risk-analytics', 'Exposure and risk analysis'],
  ['News & Events', '/financial-news', 'Financial news and calendar'],
  ['Backtesting Lab', '/strategy-backtesting', 'Test trading strategies'],
  ['Screener', '/stock-screener', 'Find assets using filters'],
  ['Alerts Center', '/alerts-center', 'Price and condition alerts'],
  ['Reports & Analytics', '/reports-analytics', 'Performance and insights'],
  ['Settings & Workspace', '/settings', 'Customize the platform'],
]

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const stocks = useSelector(selectStocks)

  const activeKey = useMemo(() => {
    const activeModule = MODULES.find(([, route]) => route === pathname)
    return activeModule ? activeModule[1].slice(1) : 'market-overview'
  }, [pathname])

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return MODULES.filter(([label, , description]) => (
      !query || `${label} ${description}`.toLowerCase().includes(query)
    )).slice(0, 5)
  }, [searchQuery])

  const filteredStocks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query ? stocks.filter((stock) => (
      stock.symbol.toLowerCase().includes(query) || stock.name.toLowerCase().includes(query)
    )).slice(0, 6) : []
  }, [searchQuery, stocks])

  const go = (route) => {
    router.push(route)
    setSearchOpen(false)
    setSearchQuery('')
    setMobileMenu(false)
  }

  useEffect(() => {
    if (!searchOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [searchOpen])

  return (
    <div className="app-shell min-h-screen text-sm text-foreground">
      {mobileMenu && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeKey={activeKey}
        setActiveKey={go}
        routerPush={go}
        mobileOpen={mobileMenu}
        closeMobile={() => setMobileMenu(false)}
      />
      <div className={cn('min-h-screen transition-[margin] duration-200', collapsed ? 'lg:ml-[76px]' : 'lg:ml-64')}>
        <Topbar setSearchOpen={setSearchOpen} onMenu={() => setMobileMenu(true)} />
        <main className="app-main min-h-[calc(100vh-68px)] overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
          </div>
        </main>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/60 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false)
          }}
        >
          <section
            aria-label="Search stocks and modules"
            aria-modal="true"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
            role="dialog"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={18} className="shrink-0 text-muted" />
              <input
                autoFocus
                aria-label="Search stocks and modules"
                className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && filteredStocks[0]) {
                    go(`/company-research?symbol=${encodeURIComponent(filteredStocks[0].symbol)}`)
                  }
                }}
                placeholder="Search stocks, companies, and modules…"
                value={searchQuery}
              />
              <kbd className="hidden items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted sm:flex"><Command size={11} /> K</kbd>
              <button aria-label="Close search" className="rounded-lg p-2 text-muted hover:bg-panel-hover hover:text-foreground" onClick={() => setSearchOpen(false)}><X size={16} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredStocks.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Assets</p>
                  {filteredStocks.map((stock) => (
                    <button key={stock.symbol} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-panel-hover" onClick={() => go(`/company-research?symbol=${encodeURIComponent(stock.symbol)}`)}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-[10px] font-bold text-accent">{stock.symbol.slice(0, 2)}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{stock.symbol}</span><span className="block truncate text-[11px] text-muted">{stock.name}</span></span>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>
                  ))}
                </div>
              )}
              {filteredModules.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Modules</p>
                  {filteredModules.map(([label, route, description]) => (
                    <button key={route} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-panel-hover" onClick={() => go(route)}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-xs font-bold text-accent">{label.slice(0, 1)}</span>
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{label}</span><span className="block text-[11px] text-muted">{description}</span></span>
                      <ArrowUpRight size={15} className="text-muted" />
                    </button>
                  ))}
                </div>
              )}
              {!filteredModules.length && !filteredStocks.length && <p className="px-3 py-8 text-center text-xs text-muted">No matching stocks or modules found.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
