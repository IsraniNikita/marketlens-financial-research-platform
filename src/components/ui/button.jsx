'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = (props) => {
  const { variant = 'default', size = 'default', className } = props
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
  const variants = {
    default: 'border-accent bg-accent text-accent-foreground shadow-sm shadow-accent/15 hover:bg-accent-hover',
    destructive: 'border-negative/30 bg-negative text-negative-foreground hover:brightness-110',
    outline: 'border-border bg-transparent text-foreground hover:border-accent/50 hover:bg-panel-hover',
    secondary: 'border-border bg-panel-hover text-foreground hover:border-accent/40 hover:bg-panel',
    ghost: 'border-transparent bg-transparent text-muted hover:bg-panel-hover hover:text-foreground',
    success: 'border-positive bg-positive text-positive-foreground hover:brightness-110',
    danger: 'border-negative bg-negative text-negative-foreground hover:brightness-110',
  }
  const sizes = {
    default: 'h-10 px-4 text-xs',
    sm: 'h-9 px-3 text-[11px]',
    lg: 'h-11 px-6 text-sm',
    icon: 'h-10 w-10 p-0',
  }
  return cn(base, variants[variant], sizes[size], className)
}

export function Button({ className, variant, size, asChild = false, fullWidth = false, children, ...props }) {
  const classes = buttonVariants({ variant, size, className: cn(fullWidth && 'w-full', className) })
  if (asChild) {
    const child = React.Children.only(children)
    if (!React.isValidElement(child)) throw new Error('Button with asChild requires a single valid element.')
    return React.cloneElement(child, {
      ...props,
      className: cn(classes, child.props.className),
    })
  }
  return (
    <button className={classes} type={props.type || 'button'} {...props}>{children}</button>
  )
}

export default Button
