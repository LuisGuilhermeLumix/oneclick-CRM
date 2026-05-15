import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'
import { startOfDayUTC, endOfDayUTC } from '@/lib/dates'
import {
  calcAbandonedCarts,
  calcDisparosFeitos,
  calcResponseRate,
  calcRecoveredSales,
  calcConversionRate,
  calcTicketMedio,
  calcValorRecuperado,
  calcComissaoLumix,
  calcFaturamentoFront,
  CRMRow,
} from '@/lib/metrics'

const TABLE = 'oneclick_info_br_CRM'

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

export interface DashboardMetrics {
  carrinhosAbandonados: number
  disparosFeitos: number
  taxaResposta: number
  vendasRecuperadas: number
  taxaConversao: number
  ticketMedio: number
  valorRecuperado: number
  comissaoLumix: number
  faturamentoSobFrontPct: number
}

const zero: DashboardMetrics = {
  carrinhosAbandonados: 0,
  disparosFeitos: 0,
  taxaResposta: 0,
  vendasRecuperadas: 0,
  taxaConversao: 0,
  ticketMedio: 0,
  valorRecuperado: 0,
  comissaoLumix: 0,
  faturamentoSobFrontPct: 0,
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
          .select('event, utm_source, status, "($)"')
          .gte('created_at', from)
          .lte('created_at', to)
        if (productFilter) q = q.eq('product', productFilter)

        const cfgPromise = supabase
          .from('crm_config')
          .select('total_revenue_usd')
          .eq('id', 1)
          .maybeSingle()

        const [rowsRes, cfgRes] = await Promise.all([q, cfgPromise])

        if ((rowsRes as any).error) throw (rowsRes as any).error
        if (cancelled) return

        const rows = ((rowsRes as any).data ?? []) as CRMRow[]

        const carrinhosAbandonados = calcAbandonedCarts(rows)
        const disparosFeitos = calcDisparosFeitos(rows)
        const taxaResposta = calcResponseRate(rows)
        const vendasRecuperadas = calcRecoveredSales(rows)
        const taxaConversao = calcConversionRate(vendasRecuperadas, carrinhosAbandonados)
        const ticketMedio = calcTicketMedio(rows)
        const valorRecuperado = calcValorRecuperado(rows)
        const comissaoLumix = calcComissaoLumix(valorRecuperado)

        const cfg = (cfgRes as any).data
        const faturamentoTotal = parseNum(cfg?.total_revenue_usd)
        const faturamentoSobFrontPct = calcFaturamentoFront(valorRecuperado, faturamentoTotal)

        setMetrics({
          carrinhosAbandonados,
          disparosFeitos,
          taxaResposta,
          vendasRecuperadas,
          taxaConversao,
          ticketMedio,
          valorRecuperado,
          comissaoLumix,
          faturamentoSobFrontPct,
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
