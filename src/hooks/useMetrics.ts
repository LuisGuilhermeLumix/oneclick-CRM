import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'
import { startOfDayUTC, endOfDayUTC } from '@/lib/dates'
import {
  CRMRow,
  EventBreakdown,
  ChannelSplit,
  ChannelMoney,
  calcLeadsBreakdown,
  calcLeadsTotal,
  calcResponseRateTotal,
  calcResponseRateBreakdown,
  calcOrderPaidCount,
  calcOrderPaidByChannel,
  calcConversionRateTotal,
  calcConversionRateBreakdown,
  calcTicketMedio,
  calcTicketMedioByChannel,
  calcValorRecuperadoTotal,
  calcValorRecuperadoByChannel,
} from '@/lib/metrics'

const TABLE = 'oneclick_info_br_CRM'

export interface DashboardMetrics {
  leadsTotal: number
  leadsBreakdown: EventBreakdown
  taxaRespostaTotal: number
  taxaRespostaBreakdown: EventBreakdown
  vendasRecuperadasTotal: number
  vendasRecuperadasChannel: ChannelSplit
  taxaConversaoTotal: number
  taxaConversaoBreakdown: EventBreakdown
  ticketMedioTotal: number
  ticketMedioChannel: ChannelMoney
  valorRecuperadoTotal: number
  valorRecuperadoChannel: ChannelMoney
  faturamentoFrontPct: number
}

const zero: DashboardMetrics = {
  leadsTotal: 0,
  leadsBreakdown: { abandoned_cart: 0, generated_pix: 0, refused_card: 0 },
  taxaRespostaTotal: 0,
  taxaRespostaBreakdown: { abandoned_cart: 0, generated_pix: 0, refused_card: 0 },
  vendasRecuperadasTotal: 0,
  vendasRecuperadasChannel: { wpp: 0, front: 0 },
  taxaConversaoTotal: 0,
  taxaConversaoBreakdown: { abandoned_cart: 0, generated_pix: 0, refused_card: 0 },
  ticketMedioTotal: 0,
  ticketMedioChannel: { wpp: 0, front: 0 },
  valorRecuperadoTotal: 0,
  valorRecuperadoChannel: { wpp: 0, front: 0 },
  faturamentoFrontPct: 0,
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

        let q = supabase
          .from(TABLE)
          .select('"Event", utm_source, status, "($)"')
          .gte('created_at', from)
          .lte('created_at', to)
        if (productFilter) q = q.eq('product', productFilter)

        const { data, error } = await q
        if (error) throw error
        if (cancelled) return

        const rows = (data ?? []) as CRMRow[]

        const leadsBreakdown = calcLeadsBreakdown(rows)
        const leadsTotal = calcLeadsTotal(leadsBreakdown)
        const taxaRespostaTotal = calcResponseRateTotal(rows)
        const taxaRespostaBreakdown = calcResponseRateBreakdown(rows)
        const vendasRecuperadasTotal = calcOrderPaidCount(rows)
        const vendasRecuperadasChannel = calcOrderPaidByChannel(rows)
        const taxaConversaoTotal = calcConversionRateTotal(vendasRecuperadasTotal, leadsTotal)
        const taxaConversaoBreakdown = calcConversionRateBreakdown(vendasRecuperadasTotal, leadsBreakdown)
        const ticketMedioTotal = calcTicketMedio(rows)
        const ticketMedioChannel = calcTicketMedioByChannel(rows)
        const valorRecuperadoTotal = calcValorRecuperadoTotal(rows)
        const valorRecuperadoChannel = calcValorRecuperadoByChannel(rows)
        const faturamentoFrontPct = valorRecuperadoTotal
          ? (valorRecuperadoChannel.wpp / valorRecuperadoTotal) * 100
          : 0

        setMetrics({
          leadsTotal,
          leadsBreakdown,
          taxaRespostaTotal,
          taxaRespostaBreakdown,
          vendasRecuperadasTotal,
          vendasRecuperadasChannel,
          taxaConversaoTotal,
          taxaConversaoBreakdown,
          ticketMedioTotal,
          ticketMedioChannel,
          valorRecuperadoTotal,
          valorRecuperadoChannel,
          faturamentoFrontPct,
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
