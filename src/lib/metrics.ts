import { LEAD_EVENTS, LeadEvent } from './events'

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

function isWPP(r: CRMRow): boolean {
  return r.utm_source === 'WPP'
}

export type EventBreakdown = Record<LeadEvent, number>

const emptyBreakdown = (): EventBreakdown => ({
  abandoned_cart: 0,
  generated_pix: 0,
  refused_card: 0,
})

export function calcLeadsBreakdown(rows: CRMRow[]): EventBreakdown {
  const out = emptyBreakdown()
  for (const r of rows) {
    if (isLead(r)) out[r.Event as LeadEvent]++
  }
  return out
}

export function calcLeadsTotal(b: EventBreakdown): number {
  return b.abandoned_cart + b.generated_pix + b.refused_card
}

export function calcResponseRateBreakdown(rows: CRMRow[]): EventBreakdown {
  const totals = emptyBreakdown()
  const responded = emptyBreakdown()
  for (const r of rows) {
    if (!isLead(r)) continue
    const ev = r.Event as LeadEvent
    totals[ev]++
    if (hasStatus(r)) responded[ev]++
  }
  return {
    abandoned_cart: totals.abandoned_cart ? (responded.abandoned_cart / totals.abandoned_cart) * 100 : 0,
    generated_pix: totals.generated_pix ? (responded.generated_pix / totals.generated_pix) * 100 : 0,
    refused_card: totals.refused_card ? (responded.refused_card / totals.refused_card) * 100 : 0,
  }
}

export function calcResponseRateTotal(rows: CRMRow[]): number {
  const leads = rows.filter(isLead)
  if (!leads.length) return 0
  const responded = leads.filter(hasStatus).length
  return (responded / leads.length) * 100
}

export function calcOrderPaidCount(rows: CRMRow[]): number {
  return rows.filter((r) => r.Event === 'order_paid').length
}

export interface ChannelSplit {
  wpp: number
  front: number
}

export function calcOrderPaidByChannel(rows: CRMRow[]): ChannelSplit {
  let wpp = 0
  let front = 0
  for (const r of rows) {
    if (r.Event !== 'order_paid') continue
    if (isWPP(r)) wpp++
    else front++
  }
  return { wpp, front }
}

export function calcConversionRateTotal(orderPaid: number, leadsTotal: number): number {
  if (!leadsTotal) return 0
  return (orderPaid / leadsTotal) * 100
}

export function calcConversionRateBreakdown(
  orderPaid: number,
  leadsBreakdown: EventBreakdown,
): EventBreakdown {
  return {
    abandoned_cart: leadsBreakdown.abandoned_cart ? (orderPaid / leadsBreakdown.abandoned_cart) * 100 : 0,
    generated_pix: leadsBreakdown.generated_pix ? (orderPaid / leadsBreakdown.generated_pix) * 100 : 0,
    refused_card: leadsBreakdown.refused_card ? (orderPaid / leadsBreakdown.refused_card) * 100 : 0,
  }
}

export interface ChannelMoney {
  wpp: number
  front: number
}

export function calcTicketMedio(rows: CRMRow[]): number {
  const paid = rows.filter((r) => r.Event === 'order_paid')
  if (!paid.length) return 0
  const total = paid.reduce((acc, r) => acc + parseNum(r['($)']), 0)
  return total / paid.length
}

export function calcTicketMedioByChannel(rows: CRMRow[]): ChannelMoney {
  let wppSum = 0
  let wppCount = 0
  let frontSum = 0
  let frontCount = 0
  for (const r of rows) {
    if (r.Event !== 'order_paid') continue
    const v = parseNum(r['($)'])
    if (isWPP(r)) {
      wppSum += v
      wppCount++
    } else {
      frontSum += v
      frontCount++
    }
  }
  return {
    wpp: wppCount ? wppSum / wppCount : 0,
    front: frontCount ? frontSum / frontCount : 0,
  }
}

export function calcValorRecuperadoTotal(rows: CRMRow[]): number {
  return rows
    .filter((r) => r.Event === 'order_paid')
    .reduce((acc, r) => acc + parseNum(r['($)']), 0)
}

export function calcValorRecuperadoByChannel(rows: CRMRow[]): ChannelMoney {
  let wpp = 0
  let front = 0
  for (const r of rows) {
    if (r.Event !== 'order_paid') continue
    const v = parseNum(r['($)'])
    if (isWPP(r)) wpp += v
    else front += v
  }
  return { wpp, front }
}
