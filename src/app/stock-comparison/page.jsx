'use client'

import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Plus, BarChart3, X as CloseIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, positiveColor, formatLarge } from '@/lib/utils'
import { selectStocks } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function StockComparison() {
  const stocks = useSelector(selectStocks)
  const [symbols, setSymbols] = useState(() => {
    const defaults = ['RELIANCE', 'TCS', 'HDFCBANK']
    if (typeof window === 'undefined') return defaults
    const requested = new URLSearchParams(window.location.search).get('add')?.toUpperCase()
    return requested && ALL_STOCKS.some((stock) => stock.symbol === requested) && !defaults.includes(requested)
      ? [...defaults.slice(0, 4), requested]
      : defaults
  })
  const [period, setPeriod] = useState('1Y')

  const selected = useMemo(() => symbols.map((symbol) => (
    stocks.find((stock) => stock.symbol === symbol) || ALL_STOCKS.find((stock) => stock.symbol === symbol)
  )).filter(Boolean), [stocks, symbols])

  const handles = useMemo(() => {
    return selected.map((s) => {
      let p = s.price
      const seed = [...s.symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
      const arr = []
      const pointCount = period === '1Y' ? 252 : 63
      for (let i = 0; i < pointCount; i++) {
        p = Math.max(p * (1 + Math.sin((i + seed) * 0.17) * 0.004 + Math.cos((i + seed) * 0.037) * 0.001), 0.01)
        arr.push(p)
      }
      const baseline = arr[0] || s.price
      return { symbol: s.symbol, name: s.name, data: arr.map((value) => Number((value / baseline * 100).toFixed(2))) }
    })
  }, [selected, period])

  const lineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: handles.map((h) => h.symbol), textStyle: { color: '#94a3b8', fontSize: 11 } },
    grid: { left: 40, right: 40, bottom: 40, top: 40, containLabel: true },
    xAxis: { type: 'category', data: handles[0] ? handles[0].data.map((_, i) => `D${i}`) : [], show: false },
    yAxis: { type: 'value', show: false },
    series: handles.map((h) => ({
      name: h.symbol,
      type: 'line',
      smooth: true,
      data: h.data,
      lineStyle: { width: 2 },
    })),
  }), [handles])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Comparison</h1>
          <p className="text-muted text-sm">Compare two to five financial assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setPeriod(p => p === '1Y' ? '3M' : '1Y')}>{period}</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Choose assets</span>
            <span className="text-[11px] font-normal text-muted">{symbols.length} of 5 selected</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ALL_STOCKS.slice(0, 20).map((stock) => {
            const isSelected = symbols.includes(stock.symbol)
            return (
              <button
                key={stock.symbol}
                aria-pressed={isSelected}
                disabled={!isSelected && symbols.length >= 5}
                onClick={() => setSymbols((current) => (
                  isSelected
                    ? current.filter((symbol) => symbol !== stock.symbol)
                    : current.length < 5 ? [...current, stock.symbol] : current
                ))}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  isSelected ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-surface text-muted hover:bg-panel-hover hover:text-foreground',
                )}
              >
                {stock.symbol} {isSelected ? <CloseIcon size={12} /> : <Plus size={12} />}
              </button>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" /> Normalized Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 300 }}><ECharts option={lineOption} /></div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected Assets</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {selected.map((stock) => {
                const sym = stock.symbol
                return (
                  <div key={sym} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{stock.symbol}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label={`Remove ${sym}`} onClick={() => setSymbols((current) => current.filter((item) => item !== sym))}><CloseIcon size={12} /></Button>
                    </div>
                    <div className={cn('text-xs font-mono font-semibold', positiveColor(stock.changePct))}>{stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%</div>
                  </div>
                )
              })}
              {symbols.length === 0 && <div className="text-xs text-muted">Select stocks to compare</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={16} className="text-accent" /> Metrics Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  {selected.map((s) => (
                    <th key={s.symbol} className="px-4 py-3 text-right">{s.symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.key} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 text-muted font-medium">{m.label}</td>
                    {selected.map((s) => {
                      const val = s[m.key]
                      return (
                        <td key={s.symbol} className={cn('px-4 py-2 text-right font-mono', m.key === 'changePct' ? positiveColor(val) : 'text-foreground')}>
                          {m.fmt(val)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const METRICS = [
  { key: 'price', label: 'Current Price', fmt: (v) => formatPrice(v) },
  { key: 'marketCap', label: 'Market Cap', fmt: (v) => formatLarge(v) },
  { key: 'pe', label: 'P/E', fmt: (v) => v?.toFixed(2) },
  { key: 'eps', label: 'EPS', fmt: (v) => v?.toFixed(2) },
  { key: 'changePct', label: 'Change %', fmt: (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%' },
]

