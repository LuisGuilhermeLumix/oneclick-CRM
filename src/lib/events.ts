export const LEAD_EVENTS = ['abandoned_cart', 'generated_pix', 'refused_card'] as const
export type LeadEvent = (typeof LEAD_EVENTS)[number]

export const EVENT_COLORS: Record<string, string> = {
  abandoned_cart: '#a855f7',
  generated_pix: '#3b82f6',
  refused_card: '#f97316',
  order_paid: '#22c55e',
}

export const EVENT_LABELS: Record<string, string> = {
  abandoned_cart: 'Carr. Abandonado',
  generated_pix: 'Pix Gerado',
  refused_card: 'Cartão Recusado',
  order_paid: 'Venda Aprovada',
}

export const WPP_ORIGINS = ['AC', 'GP', 'RC'] as const
export type WppOrigin = (typeof WPP_ORIGINS)[number]
export type LeadOrigin = WppOrigin | 'front'

export const ORIGIN_LABELS: Record<string, string> = {
  AC: 'Carr. Abandonado',
  GP: 'Pix Gerado',
  RC: 'Cartão Recusado',
  front: 'Front',
}

export const ORIGIN_COLORS: Record<string, string> = {
  AC: '#a855f7',
  GP: '#3b82f6',
  RC: '#f97316',
  front: '#9ca3af',
}

export const ORIGIN_TO_EVENT: Record<WppOrigin, LeadEvent> = {
  AC: 'abandoned_cart',
  GP: 'generated_pix',
  RC: 'refused_card',
}

export function getLeadOrigin(utm_source: string | null | undefined): LeadOrigin | null {
  if (!utm_source) return null
  if (utm_source.includes('_AC_')) return 'AC'
  if (utm_source.includes('_GP_')) return 'GP'
  if (utm_source.includes('_RC_')) return 'RC'
  if (!utm_source.includes('WPP')) return 'front'
  return null
}

export function isWppSource(utm_source: string | null | undefined): boolean {
  return !!utm_source && utm_source.includes('WPP')
}

export const PIPELINE_EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  abandoned_cart: { label: 'Carrinho Abandonado', color: '#eab308' },
  refused_card:   { label: 'Cartão Recusado',     color: '#ef4444' },
  generated_pix:  { label: 'Pix Gerado',          color: '#22c55e' },
}
