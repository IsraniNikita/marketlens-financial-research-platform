'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-panel/90 text-foreground shadow-[0_8px_28px_rgba(2,8,23,0.12)]', className)} {...props} />
  )
}
export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 px-4 pt-4 sm:px-5 sm:pt-5', className)} {...props} />
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-sm font-semibold leading-snug tracking-tight', className)} {...props} />
}
export function CardContent({ className, ...props }) {
  return <div className={cn('px-4 pb-4 sm:px-5 sm:pb-5', className)} {...props} />
}
export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center px-4 pb-4 sm:px-5 sm:pb-5', className)} {...props} />
}

export default Card
