'use client'

import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BarChart3, FileText, Clock, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, positiveColor } from '@/lib/utils'
import { selectAccount, selectPositions, selectTransactions, selectStocks } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReportsAnalytics() {
  const account = useSelector(selectAccount)
  const positions = useSelector(selectPositions)
  const transactions = useSelector(selectTransactions)
  const stocks = useSelector(selectStocks)
  const [reportType, setReportType] = useState('portfolio')
  const [dateRange, setDateRange] = useState('1M')

  const visibleTransactions = useMemo(() => {
    const cutoff = new Date()
    if (dateRange === '1M') cutoff.setMonth(cutoff.getMonth() - 1)
    if (dateRange === '3M') cutoff.setMonth(cutoff.getMonth() - 3)
    if (dateRange === '6M') cutoff.setMonth(cutoff.getMonth() - 6)
    if (dateRange === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1)
    return transactions.filter((transaction) => new Date(transaction.executedAt) >= cutoff)
  }, [transactions, dateRange])

  const holdingItems = useMemo(() => {
    const items = []
    for (const sym of Object.keys(positions)) {
      const pos = positions[sym]
      if (!pos || pos.qty <= 0) continue
      const s = stocks.find((x) => x.symbol === sym) || ALL_STOCKS.find((x) => x.symbol === sym)
      const curPrice = s ? s.price : pos.avgPrice
      items.push({ symbol: sym, name: s?.name || sym, qty: pos.qty, avgPrice: pos.avgPrice, price: curPrice, pnl: (curPrice - pos.avgPrice) * pos.qty, pnlPct: ((curPrice - pos.avgPrice) / pos.avgPrice) * 100 })
    }
    return items
  }, [positions, stocks])

  const equityOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, bottom: 30, top: 10, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, show: false },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', smooth: true, data: [100000, 102000, 101000, 105000, 107000, 106000, 108000], lineStyle: { width: 2, color: '#38bdf8' }, areaStyle: { color: 'rgba(56,189,248,0.1)' } }],
  }), [])

  const allocationOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['40%', '70%'], data: holdingItems.map((h) => ({ value: h.qty * h.price, name: h.symbol })) }],
  }), [holdingItems])

  const handleExport = () => {
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Date', 'Symbol', 'Side', 'Quantity', 'Price', 'Value', 'P&L'],
      ...visibleTransactions.map((transaction) => [
        new Date(transaction.executedAt).toISOString(),
        transaction.symbol,
        transaction.side,
        transaction.qty,
        transaction.price,
        transaction.price * transaction.qty,
        transaction.pnl,
      ]),
    ]
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportType}-${dateRange}-transactions.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted text-sm">Generate financial performance reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input text-xs w-56">
            <option value="portfolio">Portfolio Performance</option>
            <option value="trading">Trading Activity</option>
            <option value="pnl">Profit & Loss</option>
            <option value="allocation">Asset Allocation</option>
            <option value="risk">Risk Analysis</option>
          </select>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input text-xs w-32">
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
          </select>
          <Button size="sm" onClick={handleExport}>Export CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard label="Total Value" value={formatPrice(account.portfolioValue)} />
        <StatCard label="Total Return" value={`${account.totalReturnPct >= 0 ? '+' : ''}${account.totalReturnPct.toFixed(2)}%`} color={account.totalReturnPct >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Trades in Period" value={visibleTransactions.length} />
        <StatCard label="Winning Trades" value={visibleTransactions.filter((t) => t.pnl > 0).length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" /> {reportType === 'portfolio' ? 'Portfolio Performance' : `${reportType[0].toUpperCase()}${reportType.slice(1)} Report`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 300 }}><ECharts option={equityOption} /></div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={16} className="text-accent" /> P&L Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted text-sm">Realized P&L</span>
                  <span className={cn('font-mono text-sm', positiveColor(account.realizedPnL))}>{account.realizedPnL >= 0 ? '+' : ''}{account.realizedPnL.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted text-sm">Unrealized P&L</span>
                  <span className={cn('font-mono text-sm', positiveColor(account.unrealizedPnL))}>{account.unrealizedPnL >= 0 ? '+' : ''}{account.unrealizedPnL.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted text-sm">Net P&L</span>
                  <span className={cn('font-mono font-semibold text-sm', positiveColor(account.realizedPnL + account.unrealizedPnL))}>{(account.realizedPnL + account.unrealizedPnL) >= 0 ? '+' : ''}{(account.realizedPnL + account.unrealizedPnL).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={16} className="text-accent" /> Transaction Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3 text-right">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.slice().reverse().map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 text-[10px] text-muted">{new Date(t.executedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">{t.symbol}</td>
                    <td className={cn('px-4 py-2 text-right font-mono font-semibold', t.side === 'BUY' ? 'text-positive' : 'text-negative')}>{t.side}</td>
                    <td className="px-4 py-2 text-right font-mono">{t.qty}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatPrice(t.price)}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatPrice(t.price * t.qty)}</td>
                  </tr>
                ))}
                {visibleTransactions.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-xs text-muted">No transactions in this date range.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>




      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={16} className="text-accent" /> Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-center">
            <div style={{ width: 200, height: 200 }}><ECharts option={allocationOption} /></div>
          </div>
          <div className="mt-4 space-y-2">
            {holdingItems.map((h) => (
              <div key={h.symbol} className="flex justify-between items-center text-sm">
                <span className="text-muted">{h.symbol}</span>
                <div className="text-right">
                  <div className="font-mono text-foreground">{formatPrice(h.qty * h.price)}</div>
                  <div className={cn('text-xs', positiveColor(h.pnlPct))}>{h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(1)}%</div>
                </div>
              </div>
            ))}
            {holdingItems.length === 0 && <div className="text-xs text-muted text-center py-4">No holdings.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-border p-4 bg-panel">
      <div className="text-[10px] text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={cn('text-lg font-bold text-foreground', color === 'negative' ? 'text-negative' : color === 'positive' ? 'text-positive' : '')}>{value}</div>
    </div>
  )
}
