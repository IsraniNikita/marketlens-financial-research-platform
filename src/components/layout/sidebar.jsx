'use client'

import {
  Activity, ArrowLeftRight, BarChart3, Bell, Building2, ChevronLeft,
  ChevronRight, Cpu, DollarSign, LayoutDashboard, List, Newspaper, Search,
  Settings, ShieldAlert, SlidersHorizontal, Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  ['market-overview', 'Market Overview', LayoutDashboard, '/market-overview'],
  ['market-explorer', 'Market Explorer', Search, '/market-explorer'],
  ['company-research', 'Company Research', Building2, '/company-research'],
  ['stock-comparison', 'Stock Comparison', ArrowLeftRight, '/stock-comparison'],
  ['trading-terminal', 'Trading Terminal', DollarSign, '/trading-terminal'],
  ['technical-analysis', 'Technical Analysis', Activity, '/technical-analysis'],
  ['watchlists', 'Watchlists', List, '/watchlists'],
  ['paper-trading', 'Paper Trading', Wallet, '/paper-trading'],
  ['portfolio-manager', 'Portfolio Manager', DollarSign, '/portfolio-manager'],
  ['risk-analytics', 'Risk Analytics', ShieldAlert, '/risk-analytics'],
  ['financial-news', 'News & Events', Newspaper, '/financial-news'],
  ['strategy-backtesting', 'Backtesting Lab', Cpu, '/strategy-backtesting'],
  ['stock-screener', 'Screener', SlidersHorizontal, '/stock-screener'],
  ['alerts-center', 'Alerts Center', Bell, '/alerts-center'],
  ['reports-analytics', 'Reports & Analytics', BarChart3, '/reports-analytics'],
  ['settings', 'Settings & Workspace', Settings, '/settings'],
]

export default function Sidebar({
  collapsed,
  setCollapsed,
  activeKey,
  setActiveKey,
  mobileOpen,
  closeMobile,
}) {
  return (
    <aside className={cn(
      'sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-[width,transform] duration-200 lg:z-30 lg:translate-x-0',
      collapsed ? 'w-[76px]' : 'w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
    )}>
      <div className={cn('flex h-[68px] shrink-0 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[11px] font-black tracking-tight text-accent-foreground shadow-lg shadow-accent/20">ML</div>
            <div><p className="text-sm font-bold tracking-tight">MarketLens</p><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">Market intelligence</p></div>
          </div>
        ) : <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[11px] font-black text-accent-foreground">ML</div>}
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-lg p-2 text-muted hover:bg-panel-hover hover:text-foreground lg:block"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="px-4 pb-2 pt-5">
        {!collapsed && <p className="px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted">Workspace</p>}
      </div>
      <nav aria-label="Main navigation" className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV.map(([key, label, Icon, route], index) => {
          const active = activeKey === key
          return (
            <button
              aria-current={active ? 'page' : undefined}
              key={key}
              onClick={() => { setActiveKey(route); closeMobile() }}
              title={collapsed ? label : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition-colors',
                active ? 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/20' : 'text-muted-hover hover:bg-panel-hover hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className={cn('shrink-0', active ? 'text-accent' : 'text-muted group-hover:text-foreground')} />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
              {!collapsed && <span className={cn('text-[9px] tabular-nums', active ? 'text-accent/70' : 'text-muted/60')}>{String(index + 1).padStart(2, '0')}</span>}
              {collapsed && <span className="pointer-events-none absolute left-[64px] z-50 whitespace-nowrap rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100">{label}</span>}
            </button>
          )
        })}
      </nav>

      <div className={cn('border-t border-border p-3', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3 rounded-xl bg-surface p-2.5', collapsed && 'justify-center p-2')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-[10px] font-bold text-accent">DT</div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">Demo Trader</p><p className="truncate text-[10px] text-muted">Paper account</p></div>}
          {!collapsed && <span className="h-2 w-2 rounded-full bg-positive" title="Demo account active" />}
        </div>
      </div>
    </aside>
  )
}
