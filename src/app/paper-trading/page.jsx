'use client'

import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Wallet, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, positiveColor } from '@/lib/utils'
import { selectAccount, selectPositions, selectOrders, selectTransactions, selectStocks, selectStockBySymbol } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { cancelOrder, placeOrder } from '@/store/slices/tradingSlice'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function PaperTrading() {
  const dispatch = useDispatch()
  const account = useSelector(selectAccount)
  const positions = useSelector(selectPositions)
  const orders = useSelector(selectOrders)
  const transactions = useSelector(selectTransactions)
  const stocks = useSelector(selectStocks)
  const [side, setSide] = useState('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [symbol, setSymbol] = useState('RELIANCE')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [orderError, setOrderError] = useState('')
  const stock = useSelector((state) => selectStockBySymbol(state, symbol))
  const estimatedValue = useMemo(() => {
    const q = Number(qty)
    const p = price ? Number(price) : (stock ? stock.price : 0)
    return q * p
  }, [qty, price, stock])

  const holdingItems = useMemo(() => {
    const items = []
    for (const sym of Object.keys(positions)) {
      const pos = positions[sym]
      if (!pos || pos.qty <= 0) continue
      const s = stocks.find((x) => x.symbol === sym) || ALL_STOCKS.find((x) => x.symbol === sym)
      const curPrice = s ? s.price : (pos.currentPrice || pos.avgPrice)
      items.push({ symbol: sym, name: s?.name || sym, qty: pos.qty, avgPrice: pos.avgPrice, price: curPrice, pnl: (curPrice - pos.avgPrice) * pos.qty, pnlPct: ((curPrice - pos.avgPrice) / pos.avgPrice) * 100 })
    }
    return items
  }, [positions, stocks])

  const handlePlaceOrder = (e) => {
    e.preventDefault()
    const q = Number(qty)
    const p = price ? Number(price) : null
    const stop = Number(stopPrice)
    if (!Number.isFinite(q) || q <= 0) { setOrderError('Enter a quantity greater than zero.'); return }
    if (orderType !== 'MARKET' && (!Number.isFinite(p) || p <= 0)) { setOrderError('Enter a valid order price.'); return }
    if ((orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') && (!Number.isFinite(stop) || stop <= 0)) {
      setOrderError('Enter a valid stop price.')
      return
    }
    if (!stock) { setOrderError('Select a valid stock.'); return }
    const orderPrice = orderType === 'MARKET' ? stock.price : p
    const cost = orderPrice * q
    if (side === 'BUY' && cost > account.availableCash) { setOrderError('There is not enough available cash for this order.'); return }
    if (side === 'SELL') {
      const pos = positions[symbol]
      if (!pos || pos.qty < q) { setOrderError('There are not enough shares in this position to sell.'); return }
    }
    setOrderError('')
    dispatch(placeOrder({
      symbol,
      side,
      qty: q,
      type: orderType,
      price: p,
      marketPrice: stock.price,
      stopPrice: orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT' ? stop : null,
    }))
    setQty('')
    setPrice('')
    setStopPrice('')
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paper Trading</h1>
          <p className="text-muted text-sm">Simulated virtual trading account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard label="Available Cash" value={formatPrice(account.availableCash)} />
        <StatCard label="Invested Value" value={formatPrice(account.investedValue)} />
        <StatCard label="Unrealized P&L" value={`${account.unrealizedPnL >= 0 ? '+' : ''}${account.unrealizedPnL.toFixed(2)}`} color={account.unrealizedPnL >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Total Return" value={`${account.totalReturnPct >= 0 ? '+' : ''}${account.totalReturnPct.toFixed(2)}%`} color={account.totalReturnPct >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet size={16} className="text-accent" /> Place Order
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <div className="flex gap-2">
                  <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="flex-1 input text-sm">
                    {ALL_STOCKS.slice(0, 20).map((s) => <option key={s.symbol}>{s.symbol}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setSide('BUY')} className={cn('flex-1 py-2 rounded border text-xs font-medium transition-colors', side === 'BUY' ? 'bg-positive text-white border-positive' : 'bg-surface text-foreground border-border hover:bg-panel-hover')}>BUY</button>
                    <button type="button" onClick={() => setSide('SELL')} className={cn('flex-1 py-2 rounded border text-xs font-medium transition-colors', side === 'SELL' ? 'bg-negative text-white border-negative' : 'bg-surface text-foreground border-border hover:bg-panel-hover')}>SELL</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="flex-1 input text-sm">
                    <option value="MARKET">Market</option>
                    <option value="LIMIT">Limit</option>
                    <option value="STOP_LOSS">Stop loss</option>
                    <option value="STOP_LIMIT">Stop limit</option>
                  </select>
                </div>
                <Input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" className="text-sm" />
                {orderType !== 'MARKET' && <Input type="number" min="0.01" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Order price" className="text-sm" />}
                {(orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') && <Input type="number" min="0.01" step="any" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="Stop trigger price" className="text-sm" />}
                <div className="text-right text-xs text-muted">Estimated: {formatPrice(estimatedValue)}</div>
                {orderError && <p role="alert" className="text-xs text-negative">{orderError}</p>}
                <Button type="submit" className="w-full">{side === 'BUY' ? 'Buy' : 'Sell'} Order</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {holdingItems.map((h) => (
                  <div key={h.symbol} className="border-b border-border last:border-b-0 py-2 text-sm">
                    <div className="flex justify-between">
                      <div className="font-medium">{h.name}</div>
                      <div className={cn('font-mono font-semibold', positiveColor(h.pnlPct))}>{h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%</div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>Qty {h.qty} • Avg {formatPrice(h.avgPrice)}</span>
                      <span>Price {formatPrice(h.price)}</span>
                    </div>
                  </div>
                ))}
                {holdingItems.length === 0 && <div className="text-xs text-muted text-center py-4">No positions.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History size={16} className="text-accent" /> Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="border-b border-border last:border-b-0 py-2 text-sm">
                    <div className="flex justify-between">
                      <div className="font-medium">{o.symbol}</div>
                      <Badge variant={o.status === 'EXECUTED' ? 'success' : o.status === 'PENDING' ? 'warning' : 'negative'}>{o.status}</Badge>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>{o.side} {o.qty} @ {formatPrice(o.executionPrice || o.price || 0)}</span>
                      <span>{o.executedAt ? new Date(o.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </div>
                    {o.status === 'PENDING' && <Button size="sm" variant="ghost" className="mt-1 h-7 px-2 text-negative" onClick={() => dispatch(cancelOrder(o.id))}>Cancel</Button>}
                  </div>
                ))}
                {orders.length === 0 && <div className="text-xs text-muted text-center py-4">No orders.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History size={16} className="text-accent" /> Transaction History
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
                {transactions.slice().reverse().map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 text-[10px] text-muted">{new Date(t.executedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">{t.symbol}</td>
                    <td className={cn('px-4 py-2 text-right font-mono font-semibold', t.side === 'BUY' ? 'text-positive' : 'text-negative')}>{t.side}</td>
                    <td className="px-4 py-2 text-right font-mono">{t.qty}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatPrice(t.price)}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatPrice(t.price * t.qty)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-xs text-muted">No transactions.</td></tr>}
              </tbody>
            </table>
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
      <div className={cn('text-lg font-bold text-foreground', color === 'positive' ? 'text-positive' : color === 'negative' ? 'text-negative' : '')}>{value}</div>
    </div>
  )
}