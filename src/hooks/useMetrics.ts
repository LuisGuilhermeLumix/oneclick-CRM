import { useEffect, useState } from 'react'
import { supabase, fetchAllPaged } from '@/lib/supabase'
import { useFilters } from './useFilters'
import { startOfDayUTC, endOfDayUTC } from '@/lib/dates'
import {
  CRMRow,
  EventBreakdown,
  OriginBreakdown,
  ResponseRate,
  WppCount,
  WppMoney,
  ConversionRate,
  calcLeadsBreakdown,
  calcLeadsTotal,
  calcResponseRate,
  calcVendasWpp,
  calcConversionRate,
  calcTicketMedioWpp,
  calcValorRecuperadoWpp,
  calcSomaTotalOrderPaid,
  calcComissaoLumix,
} from '@/lib/metrics'

const TABLE = 'oneclick_info_br_CRM'

export interface DashboardMetrics {
  leadsTotal: number
  leadsBreakdown: EventBreakdown
  taxaResposta: ResponseRate
  vendasWpp: WppCount
  taxaConversao: ConversionRate
  ticketMedio: WppMoney
  valorRecuperado: WppMoney
  somaTotalOrderPaid: number
  faturamentoFront: number
  faturamentoFrontPct: number
  faturamentoFrontBreakdownPct: OriginBreakdown
  comissaoLumix: number
}

const emptyEvent: EventBreakdown = { abandoned_cart: 0, generated_pix: 0, refused_card: 0 }
const emptyOrigin: OriginBreakdown = { AC: 0, GP: 0, RC: 0 }

const zero: DashboardMetrics = {
  leadsTotal: 0,
  leadsBreakdown: emptyEvent,
  taxaResposta: { total: 0, breakdown: emptyEvent },
  vendasWpp: { total: 0, breakdown: emptyOrigin },
  taxaConversao: { total: 0, breakdown: emptyEvent },
  ticketMedio: { total: 0, breakdown: emptyOrigin },
  valorRecuperado: { total: 0, breakdown: emptyOrigin },
  somaTotalOrderPaid: 0,
  faturamentoFront: 0,
  faturamentoFrontPct: 0,
  faturamentoFrontBreakdownPct: emptyOrigin,
  comissaoLumix: 0,
}

export function useMetrics() {
  const { dateFrom, dateTo, product } = useFilters()
  const [metrics, setMetrics] = useState<DashboardMetrics>(zero)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const from = startOfDayUTC(dateFrom)
        const to = endOfDayUTC(dateTo)

        const productFilter = product && product !== 'Todos' ? product : null

        const rows = await fetchAllPaged<CRMRow>((fromIdx, toIdx) => {
          let q = supabase
            .from(TABLE)
            .select('"Event", utm_source, status, "($)"')
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: true })
          if (productFilter) q = q.eq('product', productFilter)
          return q.range(fromIdx, toIdx)
        })

        if (cancelled) return

        const leadsBreakdown = calcLeadsBreakdown(rows)
        const leadsTotal = calcLeadsTotal(leadsBreakdown)
        const taxaResposta = calcResponseRate(rows)
        const vendasWpp = calcVendasWpp(rows)
        const taxaConversao = calcConversionRate(vendasWpp, leadsBreakdown)
        const ticketMedio = calcTicketMedioWpp(rows)
        const valorRecuperado = calcValorRecuperadoWpp(rows)
        const somaTotalOrderPaid = calcSomaTotalOrderPaid(rows)
        const faturamentoFront = Math.max(0, somaTotalOrderPaid - valorRecuperado.total)
        const faturamentoFrontPct = somaTotalOrderPaid
          ? (valorRecuperado.total / somaTotalOrderPaid) * 100
          : 0
        const faturamentoFrontBreakdownPct: OriginBreakdown = {
          AC: somaTotalOrderPaid ? (valorRecuperado.breakdown.AC / somaTotalOrderPaid) * 100 : 0,
          GP: somaTotalOrderPaid ? (valorRecuperado.breakdown.GP / somaTotalOrderPaid) * 100 : 0,
          RC: somaTotalOrderPaid ? (valorRecuperado.breakdown.RC / somaTotalOrderPaid) * 100 : 0,
        }
        const comissaoLumix = calcComissaoLumix(valorRecuperado.total)

        setMetrics({
          leadsTotal,
          leadsBreakdown,
          taxaResposta,
          vendasWpp,
          taxaConversao,
          ticketMedio,
          valorRecuperado,
          somaTotalOrderPaid,
          faturamentoFront,
          faturamentoFrontPct,
          faturamentoFrontBreakdownPct,
          comissaoLumix,
        })
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Erro ao buscar dados')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [dateFrom, dateTo, product])

  return { metrics, loading, error }
}
