import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'
import { calcComissaoLumix } from '@/lib/metrics'

const TABLE = 'gabriel_info_eua_CRM'

function parseDollar(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

export interface DashboardMetrics {
  carrinhosAbandonados: number
  disparosFeitos: { total: number; sms: number; email: number }
  vendasRecuperadas: { total: number; sms: number; email: number }
  taxaConversao: { total: number; sms: number; email: number }
  ticketMedio: { total: number; sms: number; email: number }
  receitaRecuperada: { total: number; sms: number; email: number }
  comissaoLumix: number
  faturamentoSobFrontPct: number
}

const zero: DashboardMetrics = {
  carrinhosAbandonados: 0,
  disparosFeitos: { total: 0, sms: 0, email: 0 },
  vendasRecuperadas: { total: 0, sms: 0, email: 0 },
  taxaConversao: { total: 0, sms: 0, email: 0 },
  ticketMedio: { total: 0, sms: 0, email: 0 },
  receitaRecuperada: { total: 0, sms: 0, email: 0 },
  comissaoLumix: 0,
  faturamentoSobFrontPct: 0,
}

export function useMetrics() {
  const { dateFrom, dateTo, channel, product } = useFilters()
  const [metrics, setMetrics] = useState<DashboardMetrics>(zero)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const from = `${dateFrom}T00:00:00.000Z`
        const to = `${dateTo}T23:59:59.999Z`

        const productFilter = product && product !== 'Todos' ? product : null

        const cartPromise = (() => {
          let q = supabase
            .from(TABLE)
            .select('id', { count: 'exact', head: true })
            .gte('created_at', from)
            .lte('created_at', to)
            .eq('Event', 'abandoned_cart_01_SMS')
          if (productFilter) q = q.eq('product', productFilter)
          return q
        })()

        const smsDisparosPromise =
          channel !== 'Email'
            ? (() => {
                let q = supabase
                  .from(TABLE)
                  .select('id', { count: 'exact', head: true })
                  .gte('created_at', from)
                  .lte('created_at', to)
                  .ilike('Event', '%abandoned_cart%SMS%')
                if (productFilter) q = q.eq('product', productFilter)
                return q
              })()
            : Promise.resolve({ count: 0, error: null as any })

        const emailDisparosPromise =
          channel !== 'SMS'
            ? (() => {
                let q = supabase
                  .from(TABLE)
                  .select('id', { count: 'exact', head: true })
                  .gte('created_at', from)
                  .lte('created_at', to)
                  .ilike('Event', '%abandoned_cart%EMAIL%')
                if (productFilter) q = q.eq('product', productFilter)
                return q
              })()
            : Promise.resolve({ count: 0, error: null as any })

        const salesPromise = (() => {
          let q = supabase
            .from(TABLE)
            .select('"($)", utm_source')
            .gte('created_at', from)
            .lte('created_at', to)
            .eq('Event', 'order_paid')
            .in('utm_source', ['SMS', 'EMAIL'])
          if (productFilter) q = q.eq('product', productFilter)
          return q
        })()

        const frontPromise = (() => {
          let q = supabase
            .from(TABLE)
            .select('"($)"')
            .gte('created_at', from)
            .lte('created_at', to)
            .eq('Event', 'order_paid')
            .eq('utm_source', 'FRONT')
          if (productFilter) q = q.eq('product', productFilter)
          return q
        })()

        const cfgPromise = supabase
          .from('crm_config')
          .select('total_revenue_usd, sms_cost_usd, email_cost_usd')
          .eq('id', 1)
          .maybeSingle()

        const [cartRes, smsDisRes, emailDisRes, salesRes, frontRes, cfgRes] =
          await Promise.all([
            cartPromise,
            smsDisparosPromise,
            emailDisparosPromise,
            salesPromise,
            frontPromise,
            cfgPromise,
          ])

        if ((salesRes as any).error) throw (salesRes as any).error
        if (cancelled) return

        const totalCart = (cartRes as any).count ?? 0

        const smsDisparos = (smsDisRes as any).count ?? 0
        const emailDisparos = (emailDisRes as any).count ?? 0
        const totalDisparos = smsDisparos + emailDisparos

        const allSales = ((salesRes as any).data ?? []) as any[]
        const smsSales =
          channel === 'Email' ? [] : allSales.filter((r) => r.utm_source === 'SMS')
        const emailSales =
          channel === 'SMS' ? [] : allSales.filter((r) => r.utm_source === 'EMAIL')

        const smsVendas = smsSales.length
        const emailVendas = emailSales.length
        const totalVendas = smsVendas + emailVendas

        const smsReceita = smsSales.reduce((acc, r) => acc + parseDollar(r['($)']), 0)
        const emailReceita = emailSales.reduce((acc, r) => acc + parseDollar(r['($)']), 0)
        const totalReceita = smsReceita + emailReceita

        const ticketSms = smsVendas > 0 ? smsReceita / smsVendas : 0
        const ticketEmail = emailVendas > 0 ? emailReceita / emailVendas : 0
        const ticketTotal = totalVendas > 0 ? totalReceita / totalVendas : 0

        const taxaSms = smsDisparos > 0 ? (smsVendas / smsDisparos) * 100 : 0
        const taxaEmail = emailDisparos > 0 ? (emailVendas / emailDisparos) * 100 : 0
        const taxaTotal = totalDisparos > 0 ? (totalVendas / totalDisparos) * 100 : 0

        const comissao = calcComissaoLumix(totalReceita)

        const cfg = (cfgRes as any).data
        const totalRevenueCfg = parseDollar(cfg?.total_revenue_usd)
        const smsCost = parseDollar(cfg?.sms_cost_usd)
        const emailCost = parseDollar(cfg?.email_cost_usd)

        let faturamentoPct = 0
        if (totalRevenueCfg > 0) {
          faturamentoPct = ((totalReceita - smsCost - emailCost) / totalRevenueCfg) * 100
        } else {
          const frontSales = ((frontRes as any).data ?? []) as any[]
          const frontTotal = frontSales.reduce((acc, r) => acc + parseDollar(r['($)']), 0)
          faturamentoPct = frontTotal > 0 ? (totalReceita / frontTotal) * 100 : 0
        }

        setMetrics({
          carrinhosAbandonados: totalCart,
          disparosFeitos: { total: totalDisparos, sms: smsDisparos, email: emailDisparos },
          vendasRecuperadas: { total: totalVendas, sms: smsVendas, email: emailVendas },
          taxaConversao: { total: taxaTotal, sms: taxaSms, email: taxaEmail },
          ticketMedio: { total: ticketTotal, sms: ticketSms, email: ticketEmail },
          receitaRecuperada: { total: totalReceita, sms: smsReceita, email: emailReceita },
          comissaoLumix: comissao,
          faturamentoSobFrontPct: faturamentoPct,
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
  }, [dateFrom, dateTo, channel, product])

  return { metrics, loading, error }
}
