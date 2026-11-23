'use client'

import { useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Sliders, Search, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, formatLarge, positiveColor } from '@/lib/utils'
import { selectScreener, selectStocks } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { generateRatios } from '@/lib/simulations'
import { deleteScreen, saveScreen, setActiveScreen } from '@/store/slices/screenerSlice'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function StockScreener() {
  const dispatch = useDispatch()
  const stocks = useSelector(selectStocks)
  const savedScreens = useSelector(selectScreener).savedScreens
  const [filters, setFilters] = useState({
    marketCapMin: '', peMax: '', roeMin: '', deMax: '', dividendMin: '', changePctMin: ''
  })
  const [screenName, setScreenName] = useState('')

  const results = useMemo(() => {
    const stockList = stocks.length ? stocks : ALL_STOCKS
    return stockList.map((stock) => {
      const generated = generateRatios(stock.symbol)
      return { ...generated, ...stock, roe: generated.roe, debtToEquity: generated.debtToEquity, dividendYield: generated.dividendYield }
    }).filter((s) => {
      if (filters.marketCapMin && s.marketCap < Number(filters.marketCapMin) * 1e7) return false
      if (filters.peMax && s.pe > Number(filters.peMax)) return false
      if (filters.roeMin && s.roe < Number(filters.roeMin)) return false
      if (filters.deMax && s.debtToEquity > Number(filters.deMax)) return false
      if (filters.dividendMin && s.dividendYield < Number(filters.dividendMin)) return false
      if (filters.changePctMin && s.changePct < Number(filters.changePctMin)) return false
      return true
    })
  }, [filters, stocks])

  const handleSaveScreen = () => {
    if (!screenName.trim()) return
    dispatch(saveScreen({ name: screenName.trim(), filters }))
    setScreenName('')
  }

  const applyScreen = (screen) => {
    setFilters(Object.fromEntries(Object.entries(screen.filters || {}).map(([key, value]) => [key, String(value)])))
    dispatch(setActiveScreen(screen.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Screener</h1>
          <p className="text-muted text-sm">Filter stocks by fundamental criteria.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilters({ marketCapMin: '', peMax: '', roeMin: '', deMax: '', dividendMin: '', changePctMin: '' })}>Clear Filters</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders size={16} className="text-accent" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Market Cap Min (Cr)</label>
                <Input aria-label="Market Cap Min (Cr)" type="number" min="0" value={filters.marketCapMin} onChange={(e) => setFilters({ ...filters, marketCapMin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">P/E Max</label>
                <Input aria-label="P/E Max" type="number" min="0" value={filters.peMax} onChange={(e) => setFilters({ ...filters, peMax: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">ROE Min (%)</label>
                <Input aria-label="ROE Min (%)" type="number" min="0" value={filters.roeMin} onChange={(e) => setFilters({ ...filters, roeMin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Debt-to-Equity Max</label>
                <Input aria-label="Debt-to-Equity Max" type="number" min="0" value={filters.deMax} onChange={(e) => setFilters({ ...filters, deMax: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Dividend Yield Min (%)</label>
                <Input aria-label="Dividend Yield Min (%)" type="number" min="0" value={filters.dividendMin} onChange={(e) => setFilters({ ...filters, dividendMin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted block">Daily Change Min (%)</label>
                <Input aria-label="Daily Change Min (%)" type="number" value={filters.changePctMin} onChange={(e) => setFilters({ ...filters, changePctMin: e.target.value })} />
              </div>
              <div className="pt-2 border-t">
                <div className="flex gap-2">
                <Input value={screenName} onChange={(e) => setScreenName(e.target.value)} placeholder="Screen name" aria-label="Screen name" />
                <Button size="sm" variant="outline" onClick={handleSaveScreen} aria-label="Save screen"><Save size={14} /></Button>
                </div>
                <div className="mt-3 space-y-1">
                {savedScreens.map((screen) => (
                  <div key={screen.id} className="flex items-center gap-1">
                    <button onClick={() => applyScreen(screen)} className="min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-xs text-muted hover:bg-panel-hover hover:text-foreground">{screen.name}</button>
                    <button aria-label={`Delete ${screen.name}`} className="rounded p-1.5 text-muted hover:bg-negative/10 hover:text-negative" onClick={() => dispatch(deleteScreen(screen.id))}><Trash2 size={12} /></button>
                  </div>
                ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Search size={16} className="text-accent" /> Results
                </span>
                <span className="text-xs text-muted">{results.length} stocks found</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                    <tr>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">P/E</th>
                      <th className="px-4 py-3 text-right">Market Cap</th>
                      <th className="px-4 py-3 text-right">ROE</th>
                      <th className="px-4 py-3 text-right">D/E</th>
                      <th className="px-4 py-3 text-right">Dividend</th>
                      <th className="px-4 py-3 text-right">Change %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((s) => (
                      <tr key={s.symbol} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2 font-medium">{s.symbol}</td>
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatPrice(s.price)}</td>
                        <td className="px-4 py-2 text-right font-mono">{s.pe?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatLarge(s.marketCap)}</td>
                        <td className="px-4 py-2 text-right font-mono">{s.roe.toFixed(1)}%</td>
                        <td className="px-4 py-2 text-right font-mono">{s.debtToEquity.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono">{s.dividendYield.toFixed(2)}%</td>
                        <td className={cn('px-4 py-2 text-right font-mono font-semibold', positiveColor(s.changePct))}>{s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%</td>
                      </tr>
                    ))}
                    {results.length === 0 && <tr><td colSpan={9} className="px-4 py-4 text-center text-xs text-muted">No stocks match the filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
