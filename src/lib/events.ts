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
