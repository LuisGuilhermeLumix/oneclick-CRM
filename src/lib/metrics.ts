export const COMMISSION_RATE = 0.10

export interface CRMRow {
  created_at?: string
  name?: string | null
  number?: string | null
  email?: string | null
  product?: string | null
  Event?: string | null
  amount?: string | number | null
  utm_source?: string | null
  '($)'?: string | number | null
  status?: string | null
}

function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  let s = String(val).replace(/[^0-9.,\-]/g, '')
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

export function calcAbandonedCarts(rows: CRMRow[]): number {
  return rows.filter((r) => r.Event === 'abandoned_cart').length
}

export function calcDisparosFeitos(rows: CRMRow[]): number {
  return rows.filter(
    (r) => r.Event === 'abandoned_cart' && r.status !== null && r.status !== '' && r.status !== undefined,
  ).length
}

export function calcResponseRate(rows: CRMRow[]): number {
  const disparos = rows.filter(
    (r) => r.Event === 'abandoned_cart' && r.status !== null && r.status !== '' && r.status !== undefined,
  )
  if (!disparos.length) return 0
  const responderam = disparos.filter((r) => r.status !== 'primeiro_contato')
  return (responderam.length / disparos.length) * 100
}

export function calcRecoveredSales(rows: CRMRow[]): number {
  return rows.filter((r) => r.Event === 'order_paid' && r.utm_source === 'WPP').length
}

export function calcConversionRate(recoveredSales: number, abandonedCarts: number): number {
  if (!abandonedCarts) return 0
  return (recoveredSales / abandonedCarts) * 100
}

export function calcTicketMedio(rows: CRMRow[]): number {
  const wppSales = rows.filter((r) => r.Event === 'order_paid' && r.utm_source === 'WPP')
  if (!wppSales.length) return 0
  const total = wppSales.reduce((acc, r) => acc + parseNum(r['($)']), 0)
  return total / wppSales.length
}

export function calcValorRecuperado(rows: CRMRow[]): number {
  return rows
    .filter((r) => r.Event === 'order_paid' && r.utm_source === 'WPP')
    .reduce((acc, r) => acc + parseNum(r['($)']), 0)
}

export function calcComissaoLumix(valorRecuperado: number): number {
  return valorRecuperado * COMMISSION_RATE
}

export function calcFaturamentoFront(valorRecuperado: number, faturamentoTotal: number): number {
  if (!faturamentoTotal) return 0
  return (valorRecuperado / faturamentoTotal) * 100
}
