'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, variant, ...props }) {
  const variants = {
    default: 'border-accent/20 bg-accent/10 text-accent',
    secondary: 'border-border bg-surface text-muted',
    destructive: 'border-negative/20 bg-negative/10 text-negative',
    outline: 'border-border text-foreground',
    success: 'border-transparent bg-positive/10 text-positive border border-positive/20',
    warning: 'border-transparent bg-warning/10 text-warning border border-warning/20',
    negative: 'border-transparent bg-negative/10 text-negative border border-negative/20',
  }
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export default Badge
