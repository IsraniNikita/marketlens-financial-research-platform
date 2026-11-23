'use client'

import { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, BarChart3, RefreshCw, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, formatPercent, positiveColor, badgeColor } from '@/lib/utils'
import { selectAccount, selectAlerts, selectIndices, selectStocks, selectSectorPerformance, selectMarketBreadth, selectWatchlists } from '@/store/selectors'
import { setIndices, setMarketBreadth, setSectorPerformance, setStocks } from '@/store/slices/marketSlice'
import { INDICES, SECTOR_PERFORMANCE } from '@/data/indices'
import { simulateMarket } from '@/lib/simulations'
import ECharts from '@/components/charts/echarts-wrapper'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function MarketOverview() {
  const dispatch = useDispatch()
  const router = useRouter()
  const stocks = useSelector(selectStocks)
  const indices = useSelector(selectIndices)
  const sectorPerformance = useSelector(selectSectorPerformance)
  const breadth = useSelector(selectMarketBreadth)
  const account = useSelector(selectAccount)
  const watchlists = useSelector(selectWatchlists)
  const alerts = useSelector(selectAlerts)

  useEffect(() => {
    dispatch(setIndices(INDICES))
    dispatch(setSectorPerformance(SECTOR_PERFORMANCE))
    const adv = stocks.filter((s) => s.changePct > 0).length
    const dec = stocks.filter((s) => s.changePct < 0).length
    const unch = stocks.filter((s) => s.changePct === 0).length
    dispatch(setMarketBreadth({ advancing: adv, declining: dec, unchanged: unch, ratio: adv / Math.max(dec, 1) }))
  }, [dispatch, stocks])

  const gainers = useMemo(() => [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5), [stocks])
  const losers = useMemo(() => [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5), [stocks])
  const active = useMemo(() => [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5), [stocks])

  const marketOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 8, bottom: 8, top: 8, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, show: false },
    yAxis: { type: 'value', show: false },
    series: [{ name: 'Market breadth', type: 'line', smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#60a5fa' }, areaStyle: { color: 'rgba(96,165,250,0.12)' }, data: [35, 42, 37, 55, 49, 64, 58, 76, 69, 84, 78, 91] }],
  }), [])

  const refreshMarket = () => dispatch(setStocks(simulateMarket(stocks)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2"><Badge variant="secondary">DEMO DATA</Badge><span className="text-[10px] text-muted">Indicative market snapshot</span></div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Market Overview</h1>
          <p className="mt-1 text-sm text-muted">A live-style pulse across indices, sectors, and your paper account.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshMarket}><RefreshCw size={14} /> Refresh demo quotes</Button>
          <Button size="sm" onClick={() => router.push('/market-explorer')}>Explore markets</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {indices.slice(0, 4).map((index) => (
          <Card key={index.symbol} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{index.symbol}</span><span className={cn('flex items-center gap-1 text-[10px] font-semibold', positiveColor(index.changePct))}>{index.changePct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{formatPercent(index.changePct)}%</span></div>
              <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">{formatPrice(index.value, '')}</p>
              <p className={cn('mt-1 text-[11px] tabular-nums', positiveColor(index.change))}>{formatPercent(index.change)} today</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader className="flex-row items-start justify-between">
            <div><CardTitle className="flex items-center gap-2"><BarChart3 size={16} className="text-accent" /> Sector performance</CardTitle><p className="mt-1 text-[11px] text-muted">Change across tracked sectors · demo snapshot</p></div>
            <Button size="sm" variant="ghost" onClick={() => router.push('/stock-screener')}>Open screener</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sectorPerformance.map((sector) => (
                <div key={sector.sector} className={cn('flex min-h-20 flex-col justify-between rounded-xl p-3', badgeColor(sector.changePct))}>
                  <span className="text-[11px] font-medium">{sector.sector}</span><span className="text-lg font-bold tabular-nums">{formatPercent(sector.changePct)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Market breadth</p><p className="mt-1 text-xs"><span className="text-positive">{breadth.advancing} advancing</span><span className="mx-2 text-muted">/</span><span className="text-negative">{breadth.declining} declining</span></p></div>
              <div className="w-28"><div className="h-1.5 overflow-hidden rounded-full bg-negative/70"><div className="h-full rounded-full bg-positive" style={{ width: `${breadth.advancing + breadth.declining ? breadth.advancing / (breadth.advancing + breadth.declining) * 100 : 0}%` }} /></div><p className="mt-1 text-right text-[9px] text-muted">{breadth.unchanged} unchanged</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="xl:col-span-4">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp size={16} className="text-accent" /> Market pulse</CardTitle><p className="text-[11px] text-muted">Illustrative intraday breadth trend</p></CardHeader>
          <CardContent><div className="h-44"><ECharts option={marketOption} /></div><div className="mt-2 flex justify-between text-[10px] text-muted"><span>Opening</span><span>Now</span></div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {[{ title: 'Top gainers', list: gainers }, { title: 'Top losers', list: losers }, { title: 'Most active', list: active }].map((section) => (
          <Card key={section.title}>
            <CardHeader className="flex-row items-center justify-between"><CardTitle>{section.title}</CardTitle><span className="text-[10px] text-muted">Today</span></CardHeader>
            <CardContent className="space-y-1">
              {section.list.map((stock) => (
                <button key={stock.symbol} onClick={() => router.push(`/company-research?symbol=${encodeURIComponent(stock.symbol)}`)} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-panel-hover">
                  <span className="min-w-0"><span className="block truncate text-xs font-semibold">{stock.symbol}</span><span className="block truncate text-[10px] text-muted">{stock.name}</span></span>
                  <span className="text-right"><span className="block text-xs font-semibold tabular-nums">{formatPrice(stock.price)}</span><span className={cn('block text-[10px] font-medium tabular-nums', positiveColor(stock.changePct))}>{formatPercent(stock.changePct)}%</span></span>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Your paper account</CardTitle><p className="mt-1 text-[11px] text-muted">Personal metrics update with simulated trades and alerts.</p></div><Button variant="ghost" size="sm" onClick={() => router.push('/portfolio-manager')}>Portfolio details</Button></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Portfolio value" value={formatPrice(account.portfolioValue)} color="text-accent" icon="₹" />
          <StatTile label="Available cash" value={formatPrice(account.availableCash)} color="text-positive" icon="+" />
          <StatTile label="Watchlists" value={watchlists.length} color="text-accent" icon="◇" />
          <StatTile label="Active alerts" value={alerts.filter((alert) => alert.active && !alert.paused).length} color="text-warning" icon="!" />
        </CardContent>
      </Card>
    </div>
  )
}

function StatTile({ label, value, color, icon }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
      <div>
        <div className="text-[10px] text-muted uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
      <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: color === 'text-positive' ? 'rgba(34,197,94,0.1)' : color === 'text-warning' ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.1)', color: color === 'text-positive' ? '#22c55e' : color === 'text-warning' ? '#f59e0b' : '#38bdf8' }}>{icon}</div>
    </div>
  )
}
