import { format, parseISO } from 'date-fns'

export const fmt = {
  date:     (d) => d ? format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy') : '—',
  datetime: (d) => d ? format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy h:mm a') : '—',
  money:    (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0),
  pct:      (n) => `${Number(n ?? 0).toFixed(1)}%`,
}

export function clsx(...args) {
  return args.filter(Boolean).join(' ')
}

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function roleBadgeClass(role) {
  return { registrar: 'badge-purple', teacher: 'badge-blue', student: 'badge-green' }[role] ?? 'badge-slate'
}

export function statusBadgeClass(status) {
  const map = {
    active: 'badge-green', inactive: 'badge-slate',
    graduated: 'badge-blue', suspended: 'badge-red',
    paid: 'badge-green', partial: 'badge-yellow', unpaid: 'badge-red',
  }
  return map[status] ?? 'badge-slate'
}

export function feeBarColor(pct) {
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 60)  return 'bg-emerald-400'
  if (pct >= 30)  return 'bg-amber-400'
  return 'bg-red-400'
}

export function getErrorMessage(err) {
  const data = err?.response?.data
  if (!data) return err?.message ?? 'Something went wrong.'
  if (typeof data === 'string') return data
  const msgs = Object.entries(data).map(([k, v]) =>
    `${k === 'detail' ? '' : k + ': '}${Array.isArray(v) ? v.join(', ') : v}`
  )
  return msgs.join(' | ')
}
