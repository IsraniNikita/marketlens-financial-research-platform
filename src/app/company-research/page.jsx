'use client'

import { Suspense, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Watch, PieChart, FileText, BarChart3, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, formatPercent, positiveColor, formatLarge } from '@/lib/utils'
import { selectStockBySymbol } from '@/store/selectors'
import { generateFinancials, generateRatios } from '@/lib/simulations'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function CompanyResearch() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading company research...</div>}>
      <CompanyResearchContent />
    </Suspense>
  )
}

function CompanyResearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const symbol = (searchParams.get('symbol') || 'RELIANCE').toUpperCase()
  const stock = useSelector((state) => selectStockBySymbol(state, symbol))
  const [timeframe, setTimeframe] = useState('1Y')
  const [statementType, setStatementType] = useState('incomeStatement')

  const data = useMemo(() => stock ? {
    financials: generateFinancials(symbol),
    ratios: generateRatios(symbol),
  } : null, [stock, symbol])

  const prices = useMemo(() => {
    if (!stock) return []
    let p = stock.price
    const seed = [...stock.symbol].reduce((sum, character) => sum + character.charCodeAt(0), 0)
    const pointCount = { '1M': 30, '3M': 63, '6M': 126, '1Y': 252, '5Y': 500 }[timeframe] || 252
    const arr = []
    for (let day = pointCount; day >= 0; day--) {
      p = Math.max(p * (1 + Math.sin((day + seed) * 1.618) * 0.006 + Math.cos((day + seed) * 0.37) * 0.002), 0.01)
      arr.push(Number(p.toFixed(2)))
    }
    return arr
  }, [stock, timeframe])

  const handleExportReport = () => {
    if (!data || !stock) return
    const content = JSON.stringify({ company: stock, financials: data.financials, ratios: data.ratios }, null, 2)
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${stock.symbol.toLowerCase()}-research-report.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const statementRows = data?.financials[statementType] || []
  const statementColumns = statementRows[0]
    ? Object.keys(statementRows[0]).filter((key) => key !== 'period')
    : []

  const candleOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: 10, right: 10, bottom: 40, top: 30, containLabel: true },
    xAxis: { type: 'category', data: prices.map((_, i) => `D${i}`), show: false },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'candlestick',
      data: prices.map((close, index) => {
        const open = index === 0 ? close : prices[index - 1]
        return [open, close, Math.min(open, close) * 0.998, Math.max(open, close) * 1.002]
      }),
      itemStyle: {
        color: '#22c55e',
        color0: '#ef4444',
        borderColor: '#22c55e',
        borderColor0: '#ef4444',
      },
    }],
  }), [prices])

  if (!stock) return (
    <div className="flex flex-col items-center justify-center h-96 text-muted">
      <AlertCircle size={32} className="mb-2" /> Company not found
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg border border-border bg-surface flex items-center justify-center text-2xl font-bold text-foreground">
            {stock.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{stock.name}</h1>
              <Badge variant={stock.changePct > 0 ? 'success' : 'negative'}>{stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%</Badge>
            </div>
            <div className="text-muted text-sm">{stock.symbol} • {stock.exchange} • {stock.sector}</div>
          </div>
        </div>
        <div className="flex items-end gap-3 text-right">
          <div>
            <div className={cn('text-2xl font-bold', positiveColor(stock.changePct))}>{formatPrice(stock.price)}</div>
            <div className={cn('text-sm font-medium', positiveColor(stock.changePct))}>{formatPercent(stock.change)} ({formatPercent(stock.changePct)}%)</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => router.push(`/watchlists?add=${stock.symbol}`)}><Watch size={16} /> Watch</Button>
            <Button size="sm" onClick={() => router.push(`/stock-comparison?add=${stock.symbol}`)}>Compare</Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" /> Price Chart
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                {['1M', '3M', '6M', '1Y', '5Y'].map((tf) => (
                  <Button key={tf} size="sm" variant={timeframe === tf ? 'default' : 'outline'} onClick={() => setTimeframe(tf)}>{tf}</Button>
                ))}
              </div>
              <div style={{ height: 320 }}><ECharts option={candleOption} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart size={16} className="text-accent" /> Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Symbol" value={stock.symbol} />
                <InfoRow label="Exchange" value={stock.exchange} />
                <InfoRow label="Sector" value={stock.sector} />
                <InfoRow label="Industry" value={stock.sector} />
                <InfoRow label="Market Cap" value={formatLarge(stock.marketCap)} />
                <InfoRow label="52 Week High" value={formatPrice(stock.high52)} />
                <InfoRow label="52 Week Low" value={formatPrice(stock.low52)} />
                <InfoRow label="Open" value={formatPrice(stock.open)} />
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium text-muted block mb-1">Description</label>
                <p className="text-sm text-muted leading-relaxed">
                  {stock.name} is a leading company in the {stock.sector} sector, traded on {stock.exchange}. This is simulated demo data for platform demonstration purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={16} className="text-accent" /> Financial Ratios
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {data ? Object.entries(data.ratios).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-xs text-muted">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  <span className="text-xs font-mono text-foreground">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                </div>
              )) : <div className="text-muted text-xs">Loading ratios...</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={16} className="text-accent" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <Button fullWidth size="sm" onClick={() => router.push(`/trading-terminal?symbol=${stock.symbol}`)}>Open Trading Terminal</Button>
              <Button fullWidth size="sm" variant="outline" onClick={() => router.push(`/technical-analysis?symbol=${stock.symbol}`)}>Technical Analysis</Button>
              <Button fullWidth size="sm" variant="outline" onClick={() => router.push(`/alerts-center?symbol=${stock.symbol}`)}>Create Price Alert</Button>
              <Button size="sm" variant="outline" className="w-full" onClick={handleExportReport}>Export Research Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={16} className="text-accent" /> Financial Statements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {[
                ['incomeStatement', 'Income Statement'],
                ['balanceSheet', 'Balance Sheet'],
                ['cashFlow', 'Cash Flow'],
              ].map(([key, label]) => (
                <Button key={key} size="sm" variant={statementType === key ? 'secondary' : 'outline'} onClick={() => setStatementType(key)}>{label}</Button>
              ))}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                  <tr>
                    <th className="px-4 py-3">Period</th>
                    {statementColumns.map((column) => <th key={column} className="px-4 py-3 text-right">{column.replace(/([A-Z])/g, ' $1')}</th>)}
                  </tr>
                </thead>
                <tbody>
                {statementRows.map((r) => (
                    <tr key={r.period} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2 text-muted">{r.period}</td>
                    {statementColumns.map((column) => (
                      <td key={column} className="px-4 py-2 text-right font-mono">
                        {Number.isFinite(r[column]) ? formatLarge(r[column]) : r[column]}
                      </td>
                    ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

