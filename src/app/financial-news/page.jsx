'use client'

import { useState, useMemo } from 'react'
import { Bookmark, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NEWS, EVENTS } from '@/lib/simulations'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FinancialNews() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [bookmarks, setBookmarks] = useState(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem('fp-news-bookmarks')
      return new Set(saved ? JSON.parse(saved) : [])
    } catch (error) {
      console.warn('[News] Failed to load bookmarks:', error)
      return new Set()
    }
  })

  const filteredNews = useMemo(() => {
    return NEWS.filter((n) => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.summary.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || n.category.toLowerCase() === filter.toLowerCase()
      return matchSearch && matchFilter
    })
  }, [filter, search])

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem('fp-news-bookmarks', JSON.stringify([...next]))
      } catch (error) {
        console.warn('[News] Failed to save bookmarks:', error)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial News & Events</h1>
          <p className="text-muted text-sm">Market news and economic events (demo content).</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input text-xs w-40">
            <option value="all">All Categories</option>
            <option value="Market">Market</option>
            <option value="Company">Company</option>
            <option value="Economy">Economy</option>
            <option value="Sector">Sector</option>
            <option value="Global">Global</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <input type="text" placeholder="Search news…" value={search} onChange={(e) => setSearch(e.target.value)} className="input w-full text-sm" />
            </div>
            {filteredNews.map((n) => (
              <div key={n.id} className="border border-border rounded-lg p-4 hover:bg-panel-hover transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider', n.sentiment === 'positive' ? 'text-positive' : n.sentiment === 'negative' ? 'text-negative' : 'text-muted')}>{n.category}</span>
                  <span className="text-[10px] text-muted">{n.time}</span>
                  <button aria-pressed={bookmarks.has(n.id)} aria-label={`${bookmarks.has(n.id) ? 'Remove' : 'Save'} bookmark for ${n.title}`} onClick={() => toggleBookmark(n.id)} className={cn('rounded-lg p-2 text-muted hover:bg-panel-hover hover:text-accent', bookmarks.has(n.id) ? 'text-accent' : '')}><Bookmark size={16} /></button>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{n.title}</h3>
                <p className="text-sm text-muted mb-3">{n.summary}</p>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>Source: {n.source}</span>
                  <span>Related: {n.related.join(', ')}</span>
                </div>
              </div>
            ))}
            {filteredNews.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">No stories match your search and category filters.</div>}
          </div>
        </div>
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={16} className="text-accent" /> Economic Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                {EVENTS.map((e) => (
                  <div key={e.id} className="border-b border-border last:border-b-0 pb-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{e.event}</span>
                      <Badge variant={e.impact === 'high' ? 'negative' : e.impact === 'medium' ? 'warning' : 'success'}>{e.impact}</Badge>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>{e.symbol}</span>
                      <span>{e.date}</span>
                    </div>
                    <div className="text-[10px] text-muted">{e.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={16} className="text-accent" /> Company Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                {EVENTS.map((event) => (
                  <div key={event.id} className="flex justify-between items-center gap-3 text-sm border-b border-border last:border-b-0 pb-2">
                    <span className="text-muted">{event.symbol} {event.event}</span>
                    <span className="text-xs font-mono text-accent">{new Date(`${event.date}T00:00:00+05:30`).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

