import {
  LEAD_EVENTS,
  LeadEvent,
  WppOrigin,
  ORIGIN_TO_EVENT,
  getLeadOrigin,
  isWppSource,
} from './events'

export const COMMISSION_RATE = 0.20

export interface CRMRow {
  created_at?: string
  name?: string | null
  number?: string | null
  email?: string | null
  product?: string | null
  Event?: string | null
  utm_source?: string | null
  '($)'?: string | number | null
  status?: string | null
}

export function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  let s = String(val).replace(/[^0-9.,\-]/g, '')
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

function isLead(r: CRMRow): boolean {
  return (LEAD_EVENTS as readonly string[]).includes(r.Event ?? '')
}

function hasStatus(r: CRMRow): boolean {
  return r.status !== null && r.status !== undefined && r.status !== ''
}

function isWppOrder(r: CRMRow): boolean {
  return r.Event === 'order_paid' && isWppSource(r.utm_source)
}

export type EventBreakdown = Record<LeadEvent, number>
export type OriginBreakdown = Record<WppOrigin, number>

const emptyEventBreakdown = (): EventBreakdown => ({
  abandoned_cart: 0,
  generated_pix: 0,
  refused_card: 0,
})

const emptyOriginBreakdown = (): OriginBreakdown => ({
  AC: 0,
  GP: 0,
  RC: 0,
})

// ─── Leads ────────────────────────────────────────────────────────────

export function calcLeadsBreakdown(rows: CRMRow[]): EventBreakdown {
  const out = emptyEventBreakdown()
  for (const r of rows) {
    if (isLead(r)) out[r.Event as LeadEvent]++
  }
  return out
}

export function calcLeadsTotal(b: EventBreakdown): number {
  return b.abandoned_cart + b.generated_pix + b.refused_card
}

// ─── Taxa de resposta (somente leads com status preenchido como denominador) ─

export interface ResponseRate {
  total: number
  breakdown: EventBreakdown
}

export function calcResponseRate(rows: CRMRow[]): ResponseRate {
  const disparados = emptyEventBreakdown()
  const responderam = emptyEventBreakdown()
  let totalDisp = 0
  let totalResp = 0
  for (const r of rows) {
    if (!isLead(r) || !hasStatus(r)) continue
    const ev = r.Event as LeadEvent
    disparados[ev]++
    totalDisp++
    if (r.status !== 'primeiro_contato') {
      responderam[ev]++
      totalResp++
    }
  }
  const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0)
  return {
    total: pct(totalResp, totalDisp),
    breakdown: {
      abandoned_cart: pct(responderam.abandoned_cart, disparados.abandoned_cart),
      generated_pix: pct(responderam.generated_pix, disparados.generated_pix),
      refused_card: pct(responderam.refused_card, disparados.refused_card),
    },
  }
}

// ─── Vendas WPP (count) ───────────────────────────────────────────────

export interface WppCount {
  total: number
  breakdown: OriginBreakdown
}

export function calcVendasWpp(rows: CRMRow[]): WppCount {
  const breakdown = emptyOriginBreakdown()
  let total = 0
  for (const r of rows) {
    if (!isWppOrder(r)) continue
    const origin = getLeadOrigin(r.utm_source)
    if (origin === 'AC' || origin === 'GP' || origin === 'RC') {
      breakdown[origin]++
      total++
    }
  }
  return { total, breakdown }
}

// ─── Taxa de conversão ────────────────────────────────────────────────

export interface ConversionRate {
  total: number
  breakdown: EventBreakdown
}

export function calcConversionRate(
  vendasWpp: WppCount,
  leads: EventBreakdown,
): ConversionRate {
  const leadsTotal = calcLeadsTotal(leads)
  const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0)
  return {
    total: pct(vendasWpp.total, leadsTotal),
    breakdown: {
      abandoned_cart: pct(vendasWpp.breakdown.AC, leads.abandoned_cart),
      generated_pix: pct(vendasWpp.breakdown.GP, leads.generated_pix),
      refused_card: pct(vendasWpp.breakdown.RC, leads.refused_card),
    },
  }
}

// ─── Valor recuperado WPP (sum + breakdown por origem) ────────────────

export interface WppMoney {
  total: number
  breakdown: OriginBreakdown
}

export function calcValorRecuperadoWpp(rows: CRMRow[]): WppMoney {
  const breakdown = emptyOriginBreakdown()
  let total = 0
  for (const r of rows) {
    if (!isWppOrder(r)) continue
    const v = parseNum(r['($)'])
    const origin = getLeadOrigin(r.utm_source)
    if (origin === 'AC' || origin === 'GP' || origin === 'RC') {
      breakdown[origin] += v
      total += v
    }
  }
  return { total, breakdown }
}

// ─── Ticket médio WPP (avg + breakdown por origem) ────────────────────

export function calcTicketMedioWpp(rows: CRMRow[]): WppMoney {
  const sums = emptyOriginBreakdown()
  const counts = emptyOriginBreakdown()
  let totalSum = 0
  let totalCount = 0
  for (const r of rows) {
    if (!isWppOrder(r)) continue
    const v = parseNum(r['($)'])
    const origin = getLeadOrigin(r.utm_source)
    if (origin === 'AC' || origin === 'GP' || origin === 'RC') {
      sums[origin] += v
      counts[origin]++
      totalSum += v
      totalCount++
    }
  }
  const avg = (s: number, c: number) => (c ? s / c : 0)
  return {
    total: avg(totalSum, totalCount),
    breakdown: {
      AC: avg(sums.AC, counts.AC),
      GP: avg(sums.GP, counts.GP),
      RC: avg(sums.RC, counts.RC),
    },
  }
}

// ─── Total order_paid (WPP + Front) para o cálculo do Front share ─────

export function calcSomaTotalOrderPaid(rows: CRMRow[]): number {
  let total = 0
  for (const r of rows) {
    if (r.Event !== 'order_paid') continue
    total += parseNum(r['($)'])
  }
  return total
}

// ─── Comissão Lumix (20% sobre WPP recuperado) ────────────────────────

export function calcComissaoLumix(valorWpp: number): number {
  return valorWpp * COMMISSION_RATE
}
