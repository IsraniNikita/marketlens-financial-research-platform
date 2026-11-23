import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(n, prefix = '₹') {
  if (n == null) return '-'
  return prefix + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatPercent(n, signed = true) {
  if (n == null) return '-'
  const v = Number(n)
  const abs = Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  return signed ? `${sign}${abs}` : abs
}

export function formatNumber(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function formatLarge(n) {
  if (n == null) return '-'
  const v = Number(n)
  if (v >= 1e7) return (v / 1e7).toFixed(2) + ' Cr'
  if (v >= 1e5) return (v / 1e5).toFixed(2) + ' Lakh'
  if (v >= 1e3) return (v / 1e3).toFixed(2) + ' K'
  return v.toFixed(2)
}

export function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function positiveColor(v) {
  if (v == null) return 'text-muted'
  return v > 0 ? 'text-positive' : v < 0 ? 'text-negative' : 'text-muted'
}

export function badgeColor(v) {
  if (v == null) return 'bg-border text-muted border border-border'
  return v > 0 ? 'bg-positive/10 text-positive border border-positive/20' : v < 0 ? 'bg-negative/10 text-negative border border-negative/20' : 'bg-border text-muted border border-border'
}
