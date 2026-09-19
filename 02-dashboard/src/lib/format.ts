import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const aed = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
})

const aedCompact = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function money(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return aed.format(value)
}

export function moneyCompact(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return aedCompact.format(value)
}

export function km(value: number) {
  return `${new Intl.NumberFormat('en-AE').format(value)} km`
}

export function shortDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function monthLabel(value: string) {
  return new Date(value).toLocaleDateString('en-AE', { month: 'short' })
}

/** Stock numbers read like a real dealer's board: FC-0A3F from the row's uuid. */
export function stockNumber(id: string) {
  return `FC-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
}
