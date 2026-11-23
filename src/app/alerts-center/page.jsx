'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Bell, Check, Clock, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectAlerts, selectTriggeredHistory } from '@/store/selectors'
import { createAlert, deleteAlert, markAlertRead, pauseAlert, resumeAlert, resetAlert, evaluateAlerts } from '@/store/slices/alertsSlice'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function AlertsCenter() {
  const dispatch = useDispatch()
  const alerts = useSelector(selectAlerts)
  const triggeredHistory = useSelector(selectTriggeredHistory)
  const [symbol, setSymbol] = useState(() => {
    if (typeof window === 'undefined') return ''
    const requested = new URLSearchParams(window.location.search).get('symbol')?.toUpperCase()
    return ALL_STOCKS.some((stock) => stock.symbol === requested) ? requested : ''
  })
  const [type, setType] = useState('priceAbove')
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleCreate = () => {
    const threshold = Number(value)
    if (!symbol || !Number.isFinite(threshold) || threshold <= 0) {
      setError('Choose a stock and enter a threshold greater than zero.')
      return
    }
    const stockObj = ALL_STOCKS.find((s) => s.symbol === symbol)
    if (!stockObj) {
      setError('Choose a valid stock.')
      return
    }
    setError('')
    dispatch(createAlert({
      symbol,
      type,
      condition: type,
      value: threshold,
      message: message || `${symbol} alert`,
    }))
    setSymbol('')
    setValue('')
    setMessage('')
  }

  const handleEvaluate = () => {
    const prices = {}
    ALL_STOCKS.forEach((s) => { prices[s.symbol] = { price: s.price, changePct: s.changePct } })
    dispatch(evaluateAlerts(prices))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts Center</h1>
          <p className="text-muted text-sm">Create and manage price alerts.</p>
        </div>
        <Button onClick={handleEvaluate} size="sm"><Clock size={14} /> Evaluate Now</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={16} className="text-accent" /> Create Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input w-full text-sm">
                <option value="">Select stock…</option>
                {ALL_STOCKS.slice(0, 20).map((s) => <option key={s.symbol}>{s.symbol}</option>)}
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input w-full text-sm">
                <option value="priceAbove">Price Above</option>
                <option value="priceBelow">Price Below</option>
                <option value="pctAbove">Change % Above</option>
                <option value="pctBelow">Change % Below</option>
              </select>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className="text-sm" />
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (optional)" className="text-sm" />
              {error && <p role="alert" className="text-xs text-negative">{error}</p>}
              <Button onClick={handleCreate} className="w-full">Create Alert</Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <Bell size={16} className="text-accent" /> Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {alerts.filter((a) => a.active).map((a) => (
                  <div key={a.id} className="border-b border-border last:border-b-0 py-2 text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{a.symbol}</div>
                        <div className="text-[10px] text-muted">{a.type} {a.value}</div>
                        <div className="text-[10px] text-muted">{a.message || ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.triggered ? 'negative' : 'success'}>{a.triggered ? 'TRIGGERED' : 'ACTIVE'}</Badge>
                        <button aria-label={`${a.paused ? 'Resume' : 'Pause'} ${a.symbol} alert`} onClick={() => a.paused ? dispatch(resumeAlert(a.id)) : dispatch(pauseAlert(a.id))} className="rounded-lg p-2 text-muted hover:bg-panel-hover hover:text-foreground">
                          {a.paused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                        <button aria-label={`Reset ${a.symbol} alert`} onClick={() => dispatch(resetAlert(a.id))} className="rounded-lg p-2 text-muted hover:bg-panel-hover hover:text-accent"><RotateCcw size={14} /></button>
                        <button aria-label={`Delete ${a.symbol} alert`} onClick={() => dispatch(deleteAlert(a.id))} className="rounded-lg p-2 text-muted hover:bg-negative/10 hover:text-negative"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.filter((a) => a.active).length === 0 && <div className="text-xs text-muted text-center py-4">No active alerts.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={16} className="text-accent" /> Triggered History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {triggeredHistory.slice().reverse().map((h) => (
                  <tr key={h.id} className={cn('border-b border-border last:border-b-0', h.read ? '' : 'bg-accent/10')}>
                    <td className="px-4 py-2 font-medium">{h.symbol}</td>
                    <td className="px-4 py-2 text-sm">{h.message}</td>
                    <td className="px-4 py-2 text-right font-mono">{h.price != null ? h.price.toFixed(2) : '-'}</td>
                    <td className="px-4 py-2 text-right text-[10px] text-muted">{new Date(h.triggeredAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-2 text-right">
                      {h.read ? <Badge variant="success">Read</Badge> : <Button size="sm" variant="ghost" aria-label={`Mark ${h.symbol} alert as read`} onClick={() => dispatch(markAlertRead(h.id))}><Check size={13} /> Mark read</Button>}
                    </td>
                  </tr>
                ))}
                {triggeredHistory.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-xs text-muted">No triggered alerts.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  }
