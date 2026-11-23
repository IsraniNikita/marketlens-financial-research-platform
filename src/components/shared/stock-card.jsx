'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, formatPercent, positiveColor } from '@/lib/utils'

export function StockCard({ stock, compact = false }) {
  const pos = useMemo(() => stock.changePct > 0, [stock.changePct])
  return (
    <div className={cn('rounded-lg border border-border p-3 hover:bg-panel-hover transition-colors cursor-pointer group', compact ? 'flex items-center gap-3' : 'flex flex-col gap-2')}>
      {compact ? (
        <>
          <div className="flex-1 min-w-0">
            <Link href={`/company-research?symbol=${stock.symbol}`} className="text-sm font-medium text-foreground hover:text-accent">{stock.name}</Link>
            <div className="text-[10px] text-muted">{stock.symbol} • {stock.sector}</div>
          </div>
          <div className="flex items-end gap-1 text-right">
            <div className={cn('text-sm font-semibold', positiveColor(stock.changePct))}>{formatPrice(stock.price)}</div>
            <div className={cn('text-xs font-medium', positiveColor(stock.changePct))}>
              {pos ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {formatPercent(stock.changePct)}
            </div>
          </div>
          <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100" />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/company-research?symbol=${stock.symbol}`} className="text-sm font-medium text-foreground hover:text-accent">{stock.name}</Link>
              <div className="text-[10px] text-muted">{stock.symbol} • {stock.sector}</div>
            </div>
            <div className="text-right">
              <div className={cn('text-sm font-semibold', positiveColor(stock.changePct))}>{formatPrice(stock.price)}</div>
              <div className={cn('text-xs font-medium', positiveColor(stock.changePct))}>
                {formatPercent(stock.change)} / {formatPercent(stock.changePct)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[11px]">
            <span className="text-muted">Vol {formatNumber(stock.volume)}</span>
            <span className="text-muted">P/E {stock.pe}</span>
          </div>
        </>
      )}
    </div>
  )
}

function formatNumber(n) {
  if (n == null) return '-'
  if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}
