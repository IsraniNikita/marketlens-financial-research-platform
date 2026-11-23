'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Activity, BarChart3, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { selectPositions, selectStocks } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { stdDev, maxDrawdown, sharpeRatio, valueAtRisk } from '@/lib/calculations'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function RiskAnalytics() {
  const positions = useSelector(selectPositions)
  const stocks = useSelector(selectStocks)

  const holdingItems = useMemo(() => {
    const items = []
    for (const sym of Object.keys(positions)) {
      const pos = positions[sym]
      if (!pos || pos.qty <= 0) continue
      const s = stocks.find((x) => x.symbol === sym) || ALL_STOCKS.find((x) => x.symbol === sym)
      const curPrice = s ? s.price : (pos.currentPrice || pos.avgPrice)
      items.push({ symbol: sym, qty: pos.qty, avgPrice: pos.avgPrice, price: curPrice, value: curPrice * pos.qty, sector: s?.sector || 'N/A' })
    }
    return items
  }, [positions, stocks])

  const totalValue = useMemo(() => holdingItems.reduce((s, h) => s + h.value, 0), [holdingItems])
  const returns = useMemo(() => {
    if (!totalValue || !holdingItems.length) return []
    return Array.from({ length: 100 }, (_, index) => holdingItems.reduce((portfolioReturn, holding) => {
      const weight = holding.value / totalValue
      const seed = [...holding.symbol].reduce((sum, character) => sum + character.charCodeAt(0), 0)
      const assetReturn = Math.sin((index + seed) * 1.731) * 0.0075 + Math.cos((index + seed) * 0.83) * 0.003
      return portfolioReturn + weight * assetReturn
    }, 0))
  }, [holdingItems, totalValue])
  const portfolioPrices = useMemo(() => {
    if (!totalValue || !returns.length) return []
    let p = totalValue
    const arr = [p]
    for (let i = 0; i < returns.length; i++) {
      p = p * (1 + returns[i])
      arr.push(Number(p.toFixed(2)))
    }
    return arr
  }, [returns, totalValue])
  const vol = useMemo(() => stdDev(returns) * Math.sqrt(252) * 100, [returns])
  const mdd = useMemo(() => maxDrawdown(portfolioPrices), [portfolioPrices])
  const sharpe = useMemo(() => sharpeRatio(returns), [returns])
  const var95 = useMemo(() => valueAtRisk(returns, 0.95), [returns])

  const sectorExposure = useMemo(() => {
    const map = {}
    for (const h of holdingItems) {
      map[h.sector] = (map[h.sector] || 0) + h.value
    }
    return Object.entries(map).map(([sector, value]) => ({ sector, value, pct: totalValue ? (value / totalValue) * 100 : 0 }))
  }, [holdingItems, totalValue])

  const drawdownOption = useMemo(() => {
    let peak = -Infinity
    const dd = portfolioPrices.map((v) => {
      if (v > peak) peak = v
      return ((peak - v) / peak) * 100
    })
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 10, right: 10, bottom: 30, top: 10, containLabel: true },
      xAxis: { type: 'category', show: false },
      yAxis: { type: 'value', show: false },
      series: [{ type: 'line', data: dd, areaStyle: { color: '#ef4444' }, lineStyle: { color: '#ef4444' }, smooth: true }],
    }
  }, [portfolioPrices])

  const sectorValue = (sector) => sectorExposure.find((exposure) => exposure.sector === sector)?.value || 0
  const largestPositionValue = Math.max(0, ...holdingItems.map((holding) => holding.value))
  const scenarioResults = [
    { scenario: 'Market -5%', impact: totalValue * 0.05 },
    { scenario: 'Market -10%', impact: totalValue * 0.10 },
    { scenario: 'IT Sector -15%', impact: sectorValue('IT') * 0.15 },
    { scenario: 'Banking Sector -8%', impact: sectorValue('Banking') * 0.08 },
    { scenario: 'Largest holding -20%', impact: largestPositionValue * 0.20 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Analytics</h1>
          <p className="text-muted text-sm">Portfolio risk metrics and scenario analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Volatility" value={`${vol.toFixed(2)}%`} />
        <StatCard label="Max Drawdown" value={`${mdd.toFixed(2)}%`} color="negative" />
        <StatCard label="Sharpe Ratio" value={sharpe.toFixed(2)} />
        <StatCard label="VaR (95%)" value={`${var95.toFixed(2)}%`} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={16} className="text-accent" /> Drawdown Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!holdingItems.length && <p className="mb-2 text-xs text-muted">Place paper trades to calculate risk from your actual holdings.</p>}
              <div style={{ height: 250 }}><ECharts option={drawdownOption} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" /> Sector Exposure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {sectorExposure.map((s) => (
                  <div key={s.sector} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted">{s.sector}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-foreground">{formatPrice(s.value)}</div>
                      <div className={cn('text-xs font-semibold', s.pct > 30 ? 'text-negative' : 'text-muted')}>{s.pct.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
                {sectorExposure.length === 0 && <div className="text-xs text-muted text-center py-4">No exposure data.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown size={16} className="text-accent" /> Scenario Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {scenarioResults.map((s) => (
                  <div key={s.scenario} className="border-b border-border last:border-b-0 py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">{s.scenario}</span>
                      <span className="font-mono text-negative">-{s.impact.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>Portfolio before: {formatPrice(totalValue)}</span>
                      <span>After: {formatPrice(totalValue - s.impact)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={cn('rounded-xl border border-border p-4 bg-panel', color === 'negative' ? 'border-negative/20' : color === 'warning' ? 'border-warning/20' : '')}>
      <div className="text-[10px] text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={cn('text-lg font-bold text-foreground', color === 'negative' ? 'text-negative' : color === 'warning' ? 'text-warning' : '')}>{value}</div>
    </div>
  )
}
