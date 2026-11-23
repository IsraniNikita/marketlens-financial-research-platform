'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, formatPercent, positiveColor } from '@/lib/utils'
import { selectStocks } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function MarketExplorer() {
  const stocks = useSelector(selectStocks)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [sortKey, setSortKey] = useState('symbol')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const sectors = useMemo(() => [...new Set(ALL_STOCKS.map((s) => s.sector))], [])
  const stockUniverse = stocks.length ? stocks : ALL_STOCKS

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return stockUniverse.filter((s) =>
      (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)) &&
      (sectorFilter === 'all' || s.sector === sectorFilter)
    )
  }, [search, sectorFilter, stockUniverse])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = sorted.slice((page - 1) * pageSize, page * pageSize)

  const miniOption = useMemo(() => ({
    grid: { left: 2, right: 2, bottom: 2, top: 2, containLabel: true },
    xAxis: { show: false },
    yAxis: { show: false },
    series: [{ type: 'line', smooth: true, lineStyle: { width: 2, color: '#38bdf8' }, data: [20, 45, 35, 60, 50] }],
  }), [])

  const changeSearch = (value) => {
    setSearch(value)
    setPage(1)
  }
  const changeSector = (sector) => {
    setSectorFilter(sector)
    setPage(1)
  }
  const changeSort = (key, direction) => {
    setSortKey(key)
    setSortDir(direction)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Explorer</h1>
          <p className="text-muted text-sm">Explore {ALL_STOCKS.length} financial assets.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Search</label>
                <Input value={search} onChange={(e) => changeSearch(e.target.value)} placeholder="Symbol or company…" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Sector</label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={sectorFilter === 'all' ? 'default' : 'outline'} onClick={() => changeSector('all')}>All</Button>
                  {sectors.map((s) => (
                    <Button key={s} size="sm" variant={sectorFilter === s ? 'default' : 'outline'} onClick={() => changeSector(s)}>{s}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Sort by</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap" onClick={() => changeSort('symbol', 'asc')}>Symbol</Button>
                  <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap" onClick={() => changeSort('price', 'desc')}>Price</Button>
                  <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap" onClick={() => changeSort('changePct', 'desc')}>Change %</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-muted" />
                  <span className="font-semibold text-foreground">Market Data</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">{sorted.length} assets</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                    <tr>
                      <th className="cursor-pointer select-none hover:bg-panel-hover text-left" onClick={() => changeSort('symbol', sortKey === 'symbol' && sortDir === 'asc' ? 'desc' : 'asc')}>Symbol {sortKey === 'symbol' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      <th className="cursor-pointer select-none hover:bg-panel-hover text-left" onClick={() => changeSort('name', sortKey === 'name' && sortDir === 'asc' ? 'desc' : 'asc')}>Company</th>
                      <th className="cursor-pointer select-none hover:bg-panel-hover">Sector</th>
                      <th className="cursor-pointer select-none hover:bg-panel-hover text-right" onClick={() => changeSort('price', sortKey === 'price' && sortDir === 'asc' ? 'desc' : 'asc')}>Price</th>
                      <th className="cursor-pointer select-none hover:bg-panel-hover text-right" onClick={() => changeSort('changePct', sortKey === 'changePct' && sortDir === 'asc' ? 'desc' : 'asc')}>Change %</th>
                      <th className="text-right">Market Cap</th>
                      <th className="text-right">Volume</th>
                      <th className="text-right">P/E</th>
                      <th className="text-right">EPS</th>
                      <th className="text-right">Chart</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr]:border-b [&_tr]:border-border [&_tr:last-child]:border-b-0 [&_tr:hover]:bg-panel-hover">
                    {current.map((s) => (
                      <tr key={s.symbol} className="group">
                        <td className="px-4 py-3 font-medium text-foreground">{s.symbol}</td>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3 text-muted">{s.sector}</td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">{formatPrice(s.price)}</td>
                        <td className={cn('px-4 py-3 text-right font-mono font-semibold', positiveColor(s.changePct))}>{formatPercent(s.changePct)}%</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{formatLarge(s.marketCap)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{formatNumber(s.volume)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{s.pe?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted">{s.eps?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right"><ECharts option={miniOption} style={{ width: 60, height: 24 }} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" asChild variant="outline"><Link href={`/company-research?symbol=${s.symbol}`}>View</Link></Button>
                          <Button size="sm" asChild variant="outline" className="ml-1"><Link href={`/watchlists?add=${s.symbol}`}>+Watch</Link></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <div>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, sorted.length)} of {sorted.length}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function formatNumber(n) {
  if (n == null) return '-'
  if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}

function formatLarge(n) {
  if (n == null) return '-'
  if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}

