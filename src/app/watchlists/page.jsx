'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { List, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, positiveColor } from '@/lib/utils'
import { selectWatchlists, selectActiveWatchlist, selectWatchlistStocks } from '@/store/selectors'
import { createWatchlist, addToWatchlist, removeFromWatchlist, deleteWatchlist, setActiveWatchlist } from '@/store/slices/watchlistSlice'
import { ALL_STOCKS } from '@/data/stocks-combined'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Watchlists() {
  const dispatch = useDispatch()
  const watchlists = useSelector(selectWatchlists)
  const activeWatchlist = useSelector(selectActiveWatchlist)
  const activeStocks = useSelector((state) => selectWatchlistStocks(state, activeWatchlist?.id || ''))
  const [newName, setNewName] = useState('')
  const deepLinkHandled = useRef(false)

  useEffect(() => {
    if (deepLinkHandled.current) return
    const requestedSymbol = new URLSearchParams(window.location.search).get('add')?.toUpperCase()
    if (!requestedSymbol || !ALL_STOCKS.some((stock) => stock.symbol === requestedSymbol)) return
    deepLinkHandled.current = true
    if (activeWatchlist) {
      dispatch(addToWatchlist({ watchlistId: activeWatchlist.id, symbol: requestedSymbol }))
      return
    }
    if (watchlists.length) {
      dispatch(setActiveWatchlist(watchlists[0].id))
      dispatch(addToWatchlist({ watchlistId: watchlists[0].id, symbol: requestedSymbol }))
      return
    }
    const watchlistId = `watchlist-${Date.now()}`
    dispatch(createWatchlist({ id: watchlistId, name: 'My Watchlist' }))
    dispatch(addToWatchlist({ watchlistId, symbol: requestedSymbol }))
  }, [activeWatchlist, dispatch, watchlists])

  const handleCreate = () => {
    if (!newName.trim()) return
    dispatch(createWatchlist({ name: newName.trim() }))
    setNewName('')
  }

  const handleAddToActive = (symbol) => {
    if (!activeWatchlist) return
    dispatch(addToWatchlist({ watchlistId: activeWatchlist.id, symbol }))
  }

  const handleRemove = (symbol) => {
    if (!activeWatchlist) return
    dispatch(removeFromWatchlist({ watchlistId: activeWatchlist.id, symbol }))
  }

  const stockBySymbol = useMemo(() => {
    const map = {}
    ALL_STOCKS.forEach((s) => { map[s.symbol] = s })
    return map
  }, [])
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Watchlists</h1>
          <p className="text-muted text-sm">Create and manage your watchlists.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New watchlist name…" className="w-64 text-sm" />
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List size={16} className="text-accent" /> Your Watchlists
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {watchlists.map((wl) => {
                  const active = activeWatchlist?.id === wl.id
                  return (
                    <div key={wl.id} className={cn('flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors',
                      active ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-surface text-foreground hover:bg-panel-hover')}>
                      <button className="min-w-0 flex-1 text-left" onClick={() => dispatch(setActiveWatchlist(wl.id))}>
                        <div className="text-sm font-medium truncate">{wl.name}</div>
                        <div className="text-[10px] text-muted">{wl.stocks.length} stocks</div>
                      </button>
                      <button aria-label={`Delete ${wl.name}`} onClick={() => dispatch(deleteWatchlist(wl.id))} className="rounded-lg p-2 text-muted hover:bg-negative/10 hover:text-negative"><Trash2 size={14} /></button>
                    </div>
                  )
                })}
                {watchlists.length === 0 && <div className="text-xs text-muted text-center py-4">No watchlists yet. Create one above.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-8">
          {activeWatchlist ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activeWatchlist.name}</h2>
                  <p className="text-muted text-sm">{activeWatchlist.stocks.length} stocks</p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="input text-xs" onChange={(e) => {
                    const s = ALL_STOCKS.find((x) => x.symbol === e.target.value)
                    if (s) handleAddToActive(s.symbol)
                  }}>
                    <option value="">Add stock…</option>
                    {ALL_STOCKS.filter((s) => !activeStocks.includes(s.symbol)).map((s) => (
                      <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                {activeStocks.map((sym) => {
                  const s = stockBySymbol[sym]
                  if (!s) return null
                  return (
                    <div key={sym} className="flex items-center justify-between px-3 py-2 rounded border border-border bg-surface">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{s.name}</div>
                          <div className="text-[10px] text-muted">{s.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className={cn('text-xs font-semibold', positiveColor(s.changePct))}>{s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%</div>
                          <div className="text-[10px] font-mono text-muted">{formatPrice(s.price)}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(sym) }} className="p-1 text-muted hover:text-negative"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )
                })}
                {activeStocks.length === 0 && <div className="text-xs text-muted text-center py-4">No stocks in this watchlist.</div>}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted">Select or create a watchlist to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

