export const COMMISSION_RATE = 0.25

export function calcComissaoLumix(totalRevenue: number): number {
  return totalRevenue * COMMISSION_RATE
}

export function calcConversionRate(recovered: number, totalLeads: number): number {
  return totalLeads > 0 ? (recovered / totalLeads) * 100 : 0
}

export function calcTicketMedio(totalRevenue: number, totalSales: number): number {
  return totalSales > 0 ? totalRevenue / totalSales : 0
}

export function calcFaturamentoFront(
  recoveredRevenue: number,
  smsCost: number,
  emailCost: number,
  totalRevenue: number,
): number {
  return totalRevenue > 0 ? ((recoveredRevenue - smsCost - emailCost) / totalRevenue) * 100 : 0
}
