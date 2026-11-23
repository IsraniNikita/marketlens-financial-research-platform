'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }) {
  return (
    <div className={cn('rounded-lg border border-border', className)}>
      <table className="w-full text-sm text-left" {...props} />
    </div>
  )
}
export function TableHeader({ className, ...props }) {
  return <thead className={cn('text-xs text-muted uppercase tracking-wider [&_th]:border-b [&_th]:border-border [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium', className)} {...props} />
}
export function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr]:border-b [&_tr]:border-border [&_last]:border-b-0 [&_tr:last-child]:border-b-0 [&_tr:hover]:bg-panel-hover', className)} {...props} />
}
export function TableRow({ className, ...props }) {
  return <tr className={cn('[&_td]:px-4 [&_td]:py-3.5 [&_td]:border-b [&_td]:border-border', className)} {...props} />
}
export function TableCell({ className, ...props }) {
  return <td className={cn('border-b border-border p-3 align-middle', className)} {...props} />
}
