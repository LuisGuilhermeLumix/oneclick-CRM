import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'

function parseDollar(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

export interface DashboardMetrics {
  disparosFeitos: { total: number; sms: number; email: number }
  vendasRecuperadas: { total: number; sms: number; email: number }
  taxaConversao: { total: number; sms: number; email: number }
  ticketMedio: { total: number; sms: number; email: number }
  receitaRecuperada: { total: number; sms: number; email: number }
  comissaoLumix: number
  faturamentoSobFrontPct: number
}

const zero: DashboardMetrics = {
  disparosFeitos: { total: 0, sms: 0, email: 0 },
  vendasRecuperadas: { total: 0, sms: 0, email: 0 },
  taxaConversao: { total: 0, sms: 0, email: 0 },
  ticketMedio: { total: 0, sms: 0, email: 0 },
  receitaRecuperada: { total: 0, sms: 0, email: 0 },
  comissaoLumix: 0,
  faturamentoSobFrontPct: 0,
}

export function useMetrics() {
  const { dateFrom, dateTo, channel } = useFilters()
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
        const to   = `${dateTo}T23:59:59.999Z`

        const smsDisparosPromise = channel !== 'Email'
          ? supabase
              .from('tailgrab_nutra_eua_CRM')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', from).lte('created_at', to)
              .ilike('Event', '%abandoned_cart%SMS%')
          : Promise.resolve({ count: 0, error: null as any })

        const emailDisparosPromise = channel !== 'SMS'
          ? supabase
              .from('tailgrab_nutra_eua_CRM')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', from).lte('created_at', to)
              .ilike('Event', '%abandoned_cart%EMAIL%')
          : Promise.resolve({ count: 0, error: null as any })

        const salesPromise = supabase
          .from('tailgrab_nutra_eua_CRM')
          .select('"($)", utm_source')
          .gte('created_at', from).lte('created_at', to)
          .eq('Event', 'order_paid')
          .in('utm_source', ['SMS', 'EMAIL'])

        const frontPromise = supabase
          .from('tailgrab_nutra_eua_CRM')
          .select('"($)"')
          .gte('created_at', from).lte('created_at', to)
          .eq('Event', 'order_paid')
          .eq('utm_source', 'FRONT')

        const [smsDisRes, emailDisRes, salesRes, frontRes] = await Promise.all([
          smsDisparosPromise,
          emailDisparosPromise,
          salesPromise,
          frontPromise,
        ])

        if (salesRes.error) throw salesRes.error

        if (cancelled) return

        const smsDisparos   = (smsDisRes as any).count ?? 0
        const emailDisparos = (emailDisRes as any).count ?? 0
        const totalDisparos = smsDisparos + emailDisparos

        const allSales = (salesRes.data ?? []) as any[]
        const smsSales   = channel === 'Email' ? [] : allSales.filter((r) => r.utm_source === 'SMS')
        const emailSales = channel === 'SMS'   ? [] : allSales.filter((r) => r.utm_source === 'EMAIL')

        const smsVendas   = smsSales.length
        const emailVendas = emailSales.length
        const totalVendas = smsVendas + emailVendas

        const smsReceita   = smsSales.reduce((acc, r) => acc + parseDollar(r['($)']), 0)
        const emailReceita = emailSales.reduce((acc, r) => acc + parseDollar(r['($)']), 0)
        const totalReceita = smsReceita + emailReceita

        const ticketSms   = smsVendas   > 0 ? smsReceita   / smsVendas   : 0
        const ticketEmail = emailVendas > 0 ? emailReceita / emailVendas : 0
        const ticketTotal = totalVendas > 0 ? totalReceita / totalVendas : 0

        const taxaSms   = smsDisparos   > 0 ? (smsVendas   / smsDisparos)   * 100 : 0
        const taxaEmail = emailDisparos > 0 ? (emailVendas / emailDisparos) * 100 : 0
        const taxaTotal = totalDisparos > 0 ? (totalVendas / totalDisparos) * 100 : 0

        const comissao = totalReceita * 0.13

        const frontSales  = (frontRes.data ?? []) as any[]
        const frontTotal  = frontSales.reduce((acc, r) => acc + parseDollar(r['($)']), 0)
        const faturamentoPct = frontTotal > 0 ? (totalReceita / frontTotal) * 100 : 0

        setMetrics({
          disparosFeitos:    { total: totalDisparos, sms: smsDisparos,   email: emailDisparos },
          vendasRecuperadas: { total: totalVendas,   sms: smsVendas,     email: emailVendas   },
          taxaConversao:     { total: taxaTotal,     sms: taxaSms,       email: taxaEmail     },
          ticketMedio:       { total: ticketTotal,   sms: ticketSms,     email: ticketEmail   },
          receitaRecuperada: { total: totalReceita,  sms: smsReceita,    email: emailReceita  },
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
    return () => { cancelled = true }
  }, [dateFrom, dateTo, channel])

  return { metrics, loading, error }
}
