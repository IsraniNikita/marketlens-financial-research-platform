'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Maximize, Minimize2 } from 'lucide-react'
import { cn, formatPrice, positiveColor } from '@/lib/utils'
import {
  selectAccount,
  selectOrders,
  selectPositions,
  selectStocks,
  selectStockBySymbol,
  selectTerminal,
  selectTransactions,
} from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { setMarketDepth, setOrderBook, setSelectedSymbol, setTimeframe, setChartType, togglePanel } from '@/store/slices/terminalSlice'
import { cancelOrder, placeOrder, updatePositionPrice } from '@/store/slices/tradingSlice'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M']
const PANEL_OPTIONS = [
  ['watchlist', 'Watchlist'],
  ['orderbook', 'Order book'],
  ['depth', 'Depth'],
  ['tradehistory', 'Trades'],
  ['positions', 'Positions'],
  ['info', 'Account'],
]

export default function TradingTerminal() {
  const dispatch = useDispatch()
  const terminal = useSelector(selectTerminal)
  const stocks = useSelector(selectStocks)
  const positions = useSelector(selectPositions)
  const orders = useSelector(selectOrders)
  const transactions = useSelector(selectTransactions)
  const account = useSelector(selectAccount)
  const [fullscreen, setFullscreen] = useState(false)
  const [side, setSide] = useState('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [orderError, setOrderError] = useState('')

  const symbol = terminal.selectedSymbol || 'RELIANCE'
  const stock = useSelector((state) => selectStockBySymbol(state, symbol))
  const timeframe = terminal.timeframe || '1D'
  const panels = terminal.panels

  useEffect(() => {
    const requestedSymbol = new URLSearchParams(window.location.search).get('symbol')?.toUpperCase()
    if (requestedSymbol && ALL_STOCKS.some((item) => item.symbol === requestedSymbol)) {
      dispatch(setSelectedSymbol(requestedSymbol))
    }
  }, [dispatch])

  useEffect(() => {
    if (!stock) return
    dispatch(updatePositionPrice({ symbol, price: stock.price }))
    const bid = Number((stock.price * 0.999).toFixed(2))
    const ask = Number((stock.price * 1.001).toFixed(2))
    dispatch(setOrderBook({
      bids: [
        { price: bid, qty: 1500, total: 1500 },
        { price: Number((bid - 0.5).toFixed(2)), qty: 2300, total: 3800 },
        { price: Number((bid - 1).toFixed(2)), qty: 1200, total: 5000 },
      ],
      asks: [
        { price: ask, qty: 1800, total: 1800 },
        { price: Number((ask + 0.5).toFixed(2)), qty: 2100, total: 3900 },
        { price: Number((ask + 1).toFixed(2)), qty: 900, total: 4800 },
      ],
      spread: Number((ask - bid).toFixed(2)),
    }))
    dispatch(setMarketDepth([
      { price: bid, bidQty: 1500, askQty: 1800 },
      { price: Number((bid - 0.25).toFixed(2)), bidQty: 2300, askQty: 2100 },
      { price: Number((bid - 0.5).toFixed(2)), bidQty: 1200, askQty: 900 },
      { price: ask, bidQty: 900, askQty: 2100 },
      { price: Number((ask + 0.25).toFixed(2)), bidQty: 600, askQty: 1500 },
    ]))
  }, [stock, symbol, dispatch])

  const candles = useMemo(() => {
    if (!stock) return []
    let current = stock.price
    const seed = [...stock.symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const data = []
    for (let i = 200; i >= 0; i--) {
      const open = current
      const close = Math.max(open * (1 + Math.sin((i + seed) * 1.618) * 0.01), 0.01)
      const high = Math.max(open, close) * 1.01
      const low = Math.min(open, close) * 0.99
      data.push([open, close, low, high])
      current = close
    }
    return data
  }, [stock])

  const chartOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: 10, right: 10, bottom: 40, top: 20, containLabel: true },
    xAxis: { type: 'category', data: candles.map((_, index) => `${timeframe} ${index + 1}`), show: false },
    yAxis: { type: 'value', show: false },
    series: [{
      type: terminal.chartType === 'candlestick' ? 'candlestick' : 'line',
      data: terminal.chartType === 'candlestick' ? candles : candles.map((candle) => candle[1]),
      itemStyle: { color: '#22c55e', color0: '#ef4444', borderColor: '#22c55e', borderColor0: '#ef4444' },
    }],
  }), [candles, timeframe, terminal.chartType])

  const orderPrice = orderType === 'MARKET' ? (stock?.price || 0) : (Number(price) || 0)
  const estimatedValue = (Number(qty) || 0) * orderPrice

  const handlePlaceOrder = (event) => {
    event.preventDefault()
    const quantity = Number(qty)
    const limitPrice = orderType === 'MARKET' ? null : Number(price)
    const triggerPrice = Number(stopPrice)

    if (!stock) {
      setOrderError('Select a valid stock before placing an order.')
      return
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setOrderError('Enter a quantity greater than zero.')
      return
    }
    if (orderType !== 'MARKET' && (!Number.isFinite(limitPrice) || limitPrice <= 0)) {
      setOrderError('Enter a valid order price.')
      return
    }
    if ((orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') &&
      (!Number.isFinite(triggerPrice) || triggerPrice <= 0)) {
      setOrderError('Enter a valid stop price.')
      return
    }
    const executionPrice = orderType === 'MARKET' ? stock.price : limitPrice
    if (side === 'BUY' && executionPrice * quantity > account.availableCash) {
      setOrderError('There is not enough available cash for this order.')
      return
    }
    if (side === 'SELL' && (!positions[symbol] || positions[symbol].qty < quantity)) {
      setOrderError('There are not enough shares in this position to sell.')
      return
    }

    setOrderError('')
    dispatch(placeOrder({
      symbol,
      side,
      qty: quantity,
      type: orderType,
      price: limitPrice,
      marketPrice: stock.price,
      stopPrice: orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT' ? triggerPrice : null,
    }))
    setQty('')
    setPrice('')
    setStopPrice('')
  }

  return (
    <div className="space-y-4">
      {!fullscreen && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trading Terminal</h1>
            <p className="text-sm text-muted">Monitor quotes and place simulated orders.</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {PANEL_OPTIONS.map(([key, label]) => (
              <Button key={key} size="sm" variant={panels[key] ? 'secondary' : 'outline'} onClick={() => dispatch(togglePanel(key))}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className={cn('grid grid-cols-1 gap-4', fullscreen ? 'lg:grid-cols-1' : 'lg:grid-cols-12')}>
        {!fullscreen && panels.watchlist && (
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Watchlist</CardTitle></CardHeader>
            <CardContent className="max-h-[420px] space-y-1 overflow-y-auto p-2">
              {ALL_STOCKS.slice(0, 20).map((item) => (
                <button key={item.symbol} onClick={() => { dispatch(setSelectedSymbol(item.symbol)); setOrderError('') }}
                  className={cn('flex w-full items-center justify-between rounded px-2 py-2 text-left hover:bg-panel-hover', symbol === item.symbol && 'bg-accent/20')}>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-foreground">{item.symbol}</span>
                    <span className="block truncate text-[10px] text-muted">{item.name}</span>
                  </span>
                  <span className={cn('text-xs font-mono', positiveColor(item.changePct))}>{item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {panels.chart && (
          <Card className={fullscreen ? 'lg:col-span-12' : 'lg:col-span-9'}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{stock?.name || symbol}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span>{symbol}</span>
                  {stock && <span className={cn('font-mono', positiveColor(stock.changePct))}>{formatPrice(stock.price)} ({stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%)</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select value={timeframe} onChange={(e) => dispatch(setTimeframe(e.target.value))} className="input text-xs">
                  {TIMEFRAMES.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select value={terminal.chartType} onChange={(e) => dispatch(setChartType(e.target.value))} className="input text-xs">
                  <option value="candlestick">Candlestick</option>
                  <option value="line">Line</option>
                </select>
                <Button variant="ghost" size="icon" aria-label={fullscreen ? 'Exit fullscreen chart' : 'Expand chart'} onClick={() => setFullscreen((value) => !value)}>
                  {fullscreen ? <Minimize2 size={16} /> : <Maximize size={16} />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div style={{ height: fullscreen ? 'calc(100vh - 180px)' : 360 }}><ECharts option={chartOption} /></div>
            </CardContent>
          </Card>
        )}
      </div>

      {!fullscreen && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader><CardTitle>Place Order - {symbol}</CardTitle></CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handlePlaceOrder} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={side === 'BUY' ? 'success' : 'outline'} onClick={() => setSide('BUY')}>BUY</Button>
                  <Button type="button" variant={side === 'SELL' ? 'danger' : 'outline'} onClick={() => setSide('SELL')}>SELL</Button>
                </div>
                <label className="block space-y-1 text-xs text-muted">
                  Order type
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="input w-full">
                    <option value="MARKET">Market</option>
                    <option value="LIMIT">Limit</option>
                    <option value="STOP_LOSS">Stop loss</option>
                    <option value="STOP_LIMIT">Stop limit</option>
                  </select>
                </label>
                <label className="block space-y-1 text-xs text-muted">
                  Quantity
                  <Input type="number" min="1" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" />
                </label>
                {orderType !== 'MARKET' && (
                  <label className="block space-y-1 text-xs text-muted">
                    Price
                    <Input type="number" min="0.01" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Order price" />
                  </label>
                )}
                {(orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') && (
                  <label className="block space-y-1 text-xs text-muted">
                    Stop price
                    <Input type="number" min="0.01" step="any" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="Trigger price" />
                  </label>
                )}
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted">Estimated value</span>
                  <span className="font-mono text-foreground">{formatPrice(estimatedValue)}</span>
                </div>
                {orderError && <p role="alert" className="text-xs text-negative">{orderError}</p>}
                <Button type="submit" className="w-full">{side === 'BUY' ? 'Buy' : 'Sell'} {symbol}</Button>
              </form>
            </CardContent>
          </Card>

          {panels.info && (
            <Card className="lg:col-span-4">
              <CardHeader><CardTitle>Account</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-4 text-sm">
                <AccountLine label="Available cash" value={formatPrice(account.availableCash)} />
                <AccountLine label="Invested" value={formatPrice(account.investedValue)} />
                <AccountLine label="Unrealized P&L" value={formatPrice(account.unrealizedPnL)} color={account.unrealizedPnL} />
                <AccountLine label="Total return" value={`${account.totalReturnPct >= 0 ? '+' : ''}${account.totalReturnPct.toFixed(2)}%`} color={account.totalReturnPct} />
              </CardContent>
            </Card>
          )}

          {panels.orderbook && (
            <Card className="lg:col-span-4">
              <CardHeader><CardTitle>Order Book <span className="text-xs text-muted">Spread {formatPrice(terminal.orderBook.spread || 0)}</span></CardTitle></CardHeader>
              <CardContent className="space-y-1 p-3">
                {[...(terminal.orderBook.asks || []).slice().reverse(), ...(terminal.orderBook.bids || [])].map((level, index) => (
                  <div key={`${level.price}-${index}`} className="flex justify-between text-xs font-mono">
                    <span className={index < (terminal.orderBook.asks || []).length ? 'text-negative' : 'text-positive'}>{formatPrice(level.price)}</span>
                    <span className="text-muted">{level.qty.toLocaleString()}</span>
                    <span className="text-muted">{level.total.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {panels.depth && (
            <Card className="lg:col-span-6">
              <CardHeader><CardTitle>Market Depth</CardTitle></CardHeader>
              <CardContent className="space-y-2 p-3">
                {(terminal.marketDepth || []).map((level, index) => (
                  <div key={`${level.price}-${index}`} className="grid grid-cols-3 text-xs font-mono">
                    <span className="text-positive">{level.bidQty.toLocaleString()}</span>
                    <span className="text-center text-foreground">{formatPrice(level.price)}</span>
                    <span className="text-right text-negative">{level.askQty.toLocaleString()}</span>
                  </div>
                ))}
                {terminal.marketDepth.length === 0 && <p className="text-center text-xs text-muted">No depth data.</p>}
              </CardContent>
            </Card>
          )}

          {panels.positions && (
            <Card className="lg:col-span-6">
              <CardHeader><CardTitle>Positions</CardTitle></CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {Object.entries(positions).filter(([, position]) => position.qty > 0).map(([positionSymbol, position]) => {
                    const currentPrice = stocks.find((item) => item.symbol === positionSymbol)?.price || position.currentPrice || position.avgPrice
                    const pnl = (currentPrice - position.avgPrice) * position.qty
                    return (
                      <div key={positionSymbol} className="flex justify-between text-xs">
                        <span className="text-foreground">{positionSymbol} · {position.qty}</span>
                        <span className="font-mono text-muted">{formatPrice(currentPrice)}</span>
                        <span className={cn('font-mono', positiveColor(pnl))}>{formatPrice(pnl)}</span>
                      </div>
                    )
                  })}
                  {Object.values(positions).every((position) => position.qty <= 0) && <p className="text-center text-xs text-muted">No open positions.</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {panels.tradehistory && (
            <Card className="lg:col-span-12">
              <CardHeader><CardTitle>Orders & Trades</CardTitle></CardHeader>
              <CardContent className="p-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted uppercase [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2">
                      <tr><th>Symbol</th><th>Side</th><th className="text-right">Qty</th><th className="text-right">Price</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {orders.slice().reverse().map((order) => (
                        <tr key={order.id} className="border-b border-border last:border-b-0">
                          <td className="px-3 py-2">{order.symbol}</td>
                          <td className={cn('px-3 py-2 font-semibold', order.side === 'BUY' ? 'text-positive' : 'text-negative')}>{order.side}</td>
                          <td className="px-3 py-2 text-right font-mono">{order.qty}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatPrice(order.executionPrice || order.price || 0)}</td>
                          <td className="px-3 py-2"><Badge variant={order.status === 'EXECUTED' ? 'success' : 'secondary'}>{order.status}</Badge></td>
                          <td className="px-3 py-2 text-right">
                            {order.status === 'PENDING' && <Button variant="ghost" size="sm" onClick={() => dispatch(cancelOrder(order.id))}>Cancel</Button>}
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-muted">No orders yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {transactions.length > 0 && <p className="mt-2 text-right text-[10px] text-muted">{transactions.length} executed transaction{transactions.length === 1 ? '' : 's'}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function AccountLine({ label, value, color }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className={cn('font-mono text-foreground', color != null && positiveColor(color))}>{value}</span>
    </div>
  )
}
