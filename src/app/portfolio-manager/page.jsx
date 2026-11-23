'use client'

import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { DollarSign, PieChart, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, positiveColor, formatLarge } from '@/lib/utils'
import { selectAccount, selectPositions, selectStocks, selectPortfolios, selectActivePortfolio } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { createPortfolio, setActivePortfolio } from '@/store/slices/portfolioSlice'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PortfolioManager() {
  const dispatch = useDispatch()
  const account = useSelector(selectAccount)
  const positions = useSelector(selectPositions)
  const stocks = useSelector(selectStocks)
  const portfolios = useSelector(selectPortfolios)
  const activePortfolio = useSelector(selectActivePortfolio)
  const [newPortfolioName, setNewPortfolioName] = useState('')

  const holdingItems = useMemo(() => {
    const items = []
    for (const sym of Object.keys(positions)) {
      const pos = positions[sym]
      if (!pos || pos.qty <= 0) continue
      const s = stocks.find((x) => x.symbol === sym) || ALL_STOCKS.find((x) => x.symbol === sym)
      const curPrice = s ? s.price : (pos.currentPrice || pos.avgPrice)
      const invested = pos.avgPrice * pos.qty
      const current = curPrice * pos.qty
      items.push({ symbol: sym, name: s?.name || sym, sector: s?.sector || 'N/A', qty: pos.qty, avgPrice: pos.avgPrice, price: curPrice, invested, current, pnl: current - invested, pnlPct: invested ? ((current - invested) / invested) * 100 : 0 })
    }
    return items
  }, [positions, stocks])

  const sectorAllocation = useMemo(() => {
    const map = {}
    let total = 0
    for (const h of holdingItems) {
      map[h.sector] = (map[h.sector] || 0) + h.current
      total += h.current
    }
    return Object.entries(map).map(([sector, value]) => ({ sector, value, pct: total ? (value / total) * 100 : 0 }))
  }, [holdingItems])

  const equityOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, bottom: 30, top: 10, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, show: false },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', smooth: true, data: [100000, 102500, 101000, 105000, 107000, 105500, 108000], lineStyle: { width: 2, color: '#38bdf8' }, areaStyle: { color: 'rgba(56,189,248,0.1)' } }],
  }), [])
  const donutOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: '#94a3b8', fontSize: 11 } },
    series: [{ type: 'pie', radius: ['40%', '70%'], data: sectorAllocation.map((s) => ({ value: s.value, name: s.sector })), label: { show: false } }],
  }), [sectorAllocation])

  const handleCreatePortfolio = () => {
    if (!newPortfolioName.trim()) return
    dispatch(createPortfolio({ name: newPortfolioName.trim(), type: 'custom' }))
    setNewPortfolioName('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Portfolio Manager</h1>
          <p className="mt-1 text-sm text-muted">Track paper holdings, exposure, and portfolio performance.</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input value={newPortfolioName} onChange={(e) => setNewPortfolioName(e.target.value)} placeholder="New portfolio name…" className="min-w-0 flex-1 text-sm sm:w-64" />
          <Button onClick={handleCreatePortfolio}>Create</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard label="Total Value" value={formatPrice(account.portfolioValue)} />
        <StatCard label="Invested" value={formatPrice(account.investedValue)} />
        <StatCard label="Available Cash" value={formatPrice(account.availableCash)} />
        <StatCard label="Total Return" value={`${account.totalReturnPct >= 0 ? '+' : ''}${account.totalReturnPct.toFixed(2)}%`} color={account.totalReturnPct >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <div><CardTitle className="flex items-center gap-2"><TrendingUp size={16} className="text-accent" /> Performance</CardTitle><p className="mt-1 text-[11px] text-muted">Illustrative simulated account history</p></div>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 250 }}><ECharts option={equityOption} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <DollarSign size={16} className="text-accent" /> Holdings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                    <tr>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Avg Price</th>
                      <th className="px-4 py-3 text-right">Current</th>
                      <th className="px-4 py-3 text-right">Invested</th>
                      <th className="px-4 py-3 text-right">Current Value</th>
                      <th className="px-4 py-3 text-right">P&L</th>
                      <th className="px-4 py-3 text-right">Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingItems.map((h) => (
                      <tr key={h.symbol} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2 font-medium">{h.symbol}</td>
                        <td className="px-4 py-2 text-right font-mono">{h.qty}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatPrice(h.avgPrice)}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatPrice(h.price)}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatLarge(h.invested)}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatLarge(h.current)}</td>
                        <td className={cn('px-4 py-2 text-right font-mono font-semibold', positiveColor(h.pnl))}>{h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)}</td>
                        <td className={cn('px-4 py-2 text-right font-mono font-semibold', positiveColor(h.pnlPct))}>{h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%</td>
                      </tr>
                    ))}
                    {holdingItems.length === 0 && <tr><td colSpan={8} className="px-4 py-4 text-center text-xs text-muted">No holdings.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart size={16} className="text-accent" /> Sector Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 250 }}><ECharts option={donutOption} /></div>
              <div className="mt-4 space-y-2">
                {sectorAllocation.map((s) => (
                  <div key={s.sector} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.pct > 20 ? '#38bdf8' : s.pct > 10 ? '#f59e0b' : '#22c55e' }}></div>
                      <span className="text-muted">{s.sector}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-foreground">{formatLarge(s.value)}</div>
                      <div className="text-xs text-muted">{s.pct.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
                {sectorAllocation.length === 0 && <div className="text-xs text-muted text-center py-4">No allocation data.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolios</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {portfolios.map((p) => {
                const active = activePortfolio?.id === p.id
                return (
                  <button key={p.id} onClick={() => dispatch(setActivePortfolio(p.id))} className={cn('w-full flex items-center justify-between px-3 py-2 rounded border transition-colors',
                    active ? 'bg-accent/20 text-accent border-accent' : 'border-border bg-surface hover:bg-panel-hover text-foreground')}>
                    <span className="text-sm">{p.name}</span>
                    <span className="text-[10px] text-muted">{p.type}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-border p-4 bg-panel">
      <div className="text-[10px] text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={cn('text-lg font-bold text-foreground', color === 'positive' ? 'text-positive' : color === 'negative' ? 'text-negative' : '')}>{value}</div>
    </div>
  )
}
