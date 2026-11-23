'use client'

import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Activity, BarChart3, Cpu } from 'lucide-react'
import { cn, formatPrice, positiveColor } from '@/lib/utils'
import { selectStockBySymbol } from '@/store/selectors'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { sma, ema, rsi, macd } from '@/lib/indicators'
import ECharts from '@/components/charts/echarts-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const EMPTY_BACKTEST = {
  totalReturn: 0,
  totalReturnPct: 0,
  trades: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  profitFactor: 0,
  maxDD: 0,
  equityCurve: [],
  signals: [],
  avgProfit: 0,
  avgLoss: 0,
}

export default function StrategyBacktesting() {
  const [symbol, setSymbol] = useState('RELIANCE')
  const [strategy, setStrategy] = useState('sma')
  const [capital, setCapital] = useState('100000')
  const [positionSize, setPositionSize] = useState('100')
  const [stopLoss, setStopLoss] = useState('5')
  const [target, setTarget] = useState('10')
  const stock = useSelector((state) => selectStockBySymbol(state, symbol))

  const prices = useMemo(() => {
    if (!stock) return []
    let price = stock.price
    const seed = [...stock.symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const data = []
    for (let i = 250; i >= 0; i--) {
      price = Math.max(price * (1 + Math.sin((i + seed) * 1.618) * 0.01), 0.01)
      data.push(Number(price.toFixed(2)))
    }
    return data
  }, [stock])

  const smaData = useMemo(() => sma(prices, 20), [prices])
  const emaData = useMemo(() => ema(prices, 20), [prices])
  const rsiData = useMemo(() => rsi(prices, 14), [prices])
  const macdData = useMemo(() => macd(prices), [prices])

  const backtest = useMemo(() => {
    const startingCapital = Number(capital)
    if (!Number.isFinite(startingCapital) || startingCapital <= 0 || prices.length === 0) return EMPTY_BACKTEST

    const sizePct = Math.min(100, Math.max(0, Number(positionSize) || 0))
    const stopLossPct = Math.max(0, Number(stopLoss) || 0)
    const targetPct = Math.max(0, Number(target) || 0)
    let cash = startingCapital
    let qty = 0
    let entryPrice = 0
    let trades = 0
    let wins = 0
    let losses = 0
    let grossProfit = 0
    let grossLoss = 0
    const equityCurve = [startingCapital]
    const signals = []

    const closePosition = (price, type) => {
      const pnl = (price - entryPrice) * qty
      cash += qty * price
      trades++
      if (pnl > 0) {
        wins++
        grossProfit += pnl
      } else {
        losses++
        grossLoss += Math.abs(pnl)
      }
      signals.push({ type, price, qty, pnl })
      qty = 0
      entryPrice = 0
    }

    for (let i = 1; i < prices.length; i++) {
      const previousPrice = prices[i - 1]
      const price = prices[i]
      let signal = 0

      if (strategy === 'sma' && Number.isFinite(smaData[i - 1]) && Number.isFinite(smaData[i])) {
        if (previousPrice <= smaData[i - 1] && price > smaData[i]) signal = 1
        else if (previousPrice >= smaData[i - 1] && price < smaData[i]) signal = -1
      } else if (strategy === 'ema' && Number.isFinite(emaData[i - 1]) && Number.isFinite(emaData[i])) {
        if (previousPrice <= emaData[i - 1] && price > emaData[i]) signal = 1
        else if (previousPrice >= emaData[i - 1] && price < emaData[i]) signal = -1
      } else if (strategy === 'rsi' && Number.isFinite(rsiData[i - 1]) && Number.isFinite(rsiData[i])) {
        if (rsiData[i - 1] < 30 && rsiData[i] >= 30) signal = 1
        else if (rsiData[i - 1] > 70 && rsiData[i] <= 70) signal = -1
      } else if (strategy === 'macd' && Number.isFinite(macdData.macdLine[i - 1]) &&
        Number.isFinite(macdData.macdLine[i]) && Number.isFinite(macdData.signalLine[i - 1]) &&
        Number.isFinite(macdData.signalLine[i])) {
        if (macdData.macdLine[i - 1] <= macdData.signalLine[i - 1] && macdData.macdLine[i] > macdData.signalLine[i]) signal = 1
        else if (macdData.macdLine[i - 1] >= macdData.signalLine[i - 1] && macdData.macdLine[i] < macdData.signalLine[i]) signal = -1
      }

      if (signal === 1 && qty === 0) {
        const nextQty = Math.floor((cash * sizePct / 100) / price)
        if (nextQty > 0) {
          qty = nextQty
          entryPrice = price
          cash -= qty * price
          signals.push({ type: 'BUY', price, qty })
        }
      } else if (signal === -1 && qty > 0) {
        closePosition(price, 'SELL')
      }

      if (qty > 0) {
        const changePct = ((price - entryPrice) / entryPrice) * 100
        if ((stopLossPct > 0 && changePct <= -stopLossPct) || (targetPct > 0 && changePct >= targetPct)) {
          closePosition(price, 'EXIT')
        }
      }

      equityCurve.push(cash + qty * price)
    }

    const endingValue = equityCurve[equityCurve.length - 1]
    let peak = startingCapital
    let maxDD = 0
    for (const value of equityCurve) {
      peak = Math.max(peak, value)
      if (peak > 0) maxDD = Math.max(maxDD, ((peak - value) / peak) * 100)
    }

    return {
      totalReturn: endingValue - startingCapital,
      totalReturnPct: ((endingValue - startingCapital) / startingCapital) * 100,
      trades,
      wins,
      losses,
      winRate: trades ? (wins / trades) * 100 : 0,
      profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      maxDD,
      equityCurve,
      signals,
      avgProfit: wins ? grossProfit / wins : 0,
      avgLoss: losses ? grossLoss / losses : 0,
    }
  }, [prices, smaData, emaData, rsiData, macdData, strategy, capital, positionSize, stopLoss, target])

  const equityOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, bottom: 30, top: 10, containLabel: true },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', data: backtest.equityCurve, lineStyle: { width: 2, color: '#38bdf8' }, areaStyle: { color: 'rgba(56,189,248,0.1)' }, smooth: true }],
  }), [backtest.equityCurve])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Strategy Backtesting Lab</h1>
        <p className="text-muted text-sm">Test hypothetical strategies against simulated price history.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu size={16} className="text-accent" /> Strategy Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <label className="block space-y-2 text-xs font-medium text-muted">
                Stock
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input w-full text-sm">
                  {ALL_STOCKS.map((item) => <option key={item.symbol}>{item.symbol}</option>)}
                </select>
              </label>
              <label className="block space-y-2 text-xs font-medium text-muted">
                Strategy
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="input w-full text-sm">
                  <option value="sma">SMA Crossover</option>
                  <option value="ema">EMA Crossover</option>
                  <option value="rsi">RSI-Based</option>
                  <option value="macd">MACD Crossover</option>
                </select>
              </label>
              <NumberField label="Starting Capital" value={capital} onChange={setCapital} min="1" />
              <NumberField label="Position Size (%)" value={positionSize} onChange={setPositionSize} min="0" max="100" />
              <NumberField label="Stop Loss (%)" value={stopLoss} onChange={setStopLoss} min="0" />
              <NumberField label="Target (%)" value={target} onChange={setTarget} min="0" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 size={16} className="text-accent" /> Results</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              <StatCard label="Total Return" value={`${backtest.totalReturnPct >= 0 ? '+' : ''}${backtest.totalReturnPct.toFixed(2)}%`} color={backtest.totalReturnPct >= 0 ? 'positive' : 'negative'} />
              <StatCard label="Number of Trades" value={backtest.trades} />
              <StatCard label="Win Rate" value={`${backtest.winRate.toFixed(1)}%`} />
              <StatCard label="Profit Factor" value={backtest.profitFactor === Infinity ? '∞' : backtest.profitFactor.toFixed(2)} />
              <StatCard label="Max Drawdown" value={`${backtest.maxDD.toFixed(2)}%`} color="negative" />
              <StatCard label="Winning Trades" value={backtest.wins} />
              <StatCard label="Avg Profit" value={formatPrice(backtest.avgProfit)} />
              <StatCard label="Avg Loss" value={formatPrice(backtest.avgLoss)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity size={16} className="text-accent" /> Equity Curve</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 280 }}><ECharts option={equityOption} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Signals</CardTitle></CardHeader>
            <CardContent className="p-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                    <tr><th>Type</th><th className="text-right">Price</th><th className="text-right">Qty</th><th className="text-right">P&L</th></tr>
                  </thead>
                  <tbody>
                    {backtest.signals.slice(-20).reverse().map((signal, index) => (
                      <tr key={`${signal.type}-${index}`} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2 font-medium">{signal.type}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatPrice(signal.price)}</td>
                        <td className="px-4 py-2 text-right font-mono">{signal.qty}</td>
                        <td className={cn('px-4 py-2 text-right font-mono font-semibold', positiveColor(signal.pnl ?? 0))}>
                          {signal.pnl == null ? '-' : formatPrice(signal.pnl)}
                        </td>
                      </tr>
                    ))}
                    {backtest.signals.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-xs text-muted">No signals generated for this strategy.</td></tr>}
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

function NumberField({ label, value, onChange, ...inputProps }) {
  return (
    <label className="block space-y-2 text-xs font-medium text-muted">
      {label}
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} {...inputProps} />
    </label>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={cn('text-base font-bold text-foreground', color === 'negative' ? 'text-negative' : color === 'positive' ? 'text-positive' : '')}>{value}</div>
    </div>
  )
}
