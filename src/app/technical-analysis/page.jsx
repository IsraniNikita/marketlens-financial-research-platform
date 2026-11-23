'use client'

import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Activity, BarChart3 } from 'lucide-react'
import { cn, positiveColor } from '@/lib/utils'
import { selectStockBySymbol } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { sma, ema, rsi, bollingerBands } from '@/lib/indicators'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TechnicalAnalysis() {
  const [symbol, setSymbol] = useState(() => {
    if (typeof window === 'undefined') return 'RELIANCE'
    const requested = new URLSearchParams(window.location.search).get('symbol')?.toUpperCase()
    return ALL_STOCKS.some((item) => item.symbol === requested) ? requested : 'RELIANCE'
  })
  const [indicators, setIndicators] = useState(['sma'])
  const [period, setPeriod] = useState(14)
  const stock = useSelector((state) => selectStockBySymbol(state, symbol))

  const prices = useMemo(() => {
    if (!stock) return []
    let p = stock.price
    const seed = [...stock.symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const arr = []
    for (let i = 200; i >= 0; i--) {
      p = Math.max(p * (1 + Math.sin((i + seed) * 1.618) * 0.01), 0.01)
      arr.push(Number(p.toFixed(2)))
    }
    return arr
  }, [stock])

  const smaData = useMemo(() => sma(prices, period), [prices, period])
  const emaData = useMemo(() => ema(prices, period), [prices, period])
  const rsiData = useMemo(() => rsi(prices, period), [prices, period])
  const bb = useMemo(() => bollingerBands(prices, period), [prices, period])

  const mainSeries = useMemo(() => [
    { name: 'Price', data: prices, color: '#38bdf8' },
    ...(indicators.includes('sma') ? [{ name: 'SMA', data: smaData, color: '#f59e0b' }] : []),
    ...(indicators.includes('ema') ? [{ name: 'EMA', data: emaData, color: '#a855f7' }] : []),
    ...(indicators.includes('bb') ? [
      { name: 'BB Upper', data: bb.upper, color: '#ef4444' },
      { name: 'BB Middle', data: bb.middle, color: '#64748b' },
      { name: 'BB Lower', data: bb.lower, color: '#ef4444' },
    ] : []),
  ], [prices, indicators, smaData, emaData, bb])

  const mainOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, bottom: 40, top: 20, containLabel: true },
    legend: { data: mainSeries.map((s) => s.name), textStyle: { color: '#94a3b8', fontSize: 11 } },
    xAxis: { type: 'category', data: prices.map((_, i) => `D${i}`), show: false },
    yAxis: { type: 'value', show: false },
    series: mainSeries.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      lineStyle: { width: 2, color: s.color },
      smooth: true,
    })),
  }), [mainSeries, prices])
  const rsiOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, bottom: 40, top: 20, containLabel: true },
    xAxis: { type: 'category', data: prices.map((_, i) => `D${i}`), show: false },
    yAxis: { type: 'value', min: 0, max: 100, show: false },
    series: [{ name: 'RSI', type: 'line', data: rsiData, lineStyle: { width: 2, color: '#38bdf8' }, smooth: true }],
  }), [rsiData, prices])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Technical Analysis</h1>
          <p className="text-muted text-sm">Technical indicators and chart analysis tools.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input w-40 text-xs">
            {ALL_STOCKS.slice(0, 20).map((s) => <option key={s.symbol}>{s.symbol}</option>)}
          </select>
          <Input type="number" min="2" max="200" value={period} onChange={(e) => {
            const value = Number(e.target.value)
            if (Number.isFinite(value)) setPeriod(Math.min(200, Math.max(2, value)))
          }} aria-label="Indicator period" className="w-24 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={16} className="text-accent" /> Price Chart with Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 350 }}><ECharts option={mainOption} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" /> RSI ({period})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div style={{ height: 150 }}><ECharts option={rsiOption} /></div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>Overbought: 70</span>
                <span>Oversold: 30</span>
                <span className={cn('font-semibold', positiveColor(rsiData[rsiData.length - 1] || 0))}>
                  Current: {(rsiData[rsiData.length - 1] || 50).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-accent">IND</span> Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs text-muted mb-3">Enable indicators to overlay on the chart.</p>
              {['sma', 'ema', 'bb'].map((key) => {
                const label = { sma: 'SMA', ema: 'EMA', bb: 'Bollinger Bands' }[key]
                const active = indicators.includes(key)
                return (
                  <button key={key} onClick={() => {
                    setIndicators(active ? indicators.filter((i) => i !== key) : [...indicators, key])
                  }} className={cn('w-full flex items-center justify-between px-3 py-2 rounded border transition-colors',
                    active ? 'bg-accent/20 text-accent border-accent' : 'border-border bg-surface hover:bg-panel-hover text-foreground')}>
                    <span className="text-sm">{label}</span>
                    {active ? '✓' : '+'}
                  </button>
                )
              })}
              <div className="mt-4 pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-positive">▲</span>
                  <span className="text-xs text-muted">Positive signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-negative">▼</span>
                  <span className="text-xs text-muted">Negative signal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

