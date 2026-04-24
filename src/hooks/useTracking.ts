import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'

export interface TrackingRow {
  key: string
  date: string
  email: string
  product: string
  event: string
  slug: string
}

export interface TrackingSummary {
  total: number
  infoReceived: number
  delivered: number
  failed: number
}

export interface TrackingChartPoint {
  date: string
  infoReceived: number
  delivered: number
  failed: number
}

const PER_PAGE = 20

export function useTracking(eventFilter: string, page: number) {
  const { dateFrom, dateTo } = useFilters()
  const [rows, setRows]             = useState<TrackingRow[]>([])
  const [summary, setSummary]       = useState<TrackingSummary>({ total: 0, infoReceived: 0, delivered: 0, failed: 0 })
  const [chartData, setChartData]   = useState<TrackingChartPoint[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const from = `${dateFrom}T00:00:00.000Z`
        const to   = `${dateTo}T23:59:59.999Z`

        // Buscar TODOS os registros do período (para summary + chart)
        const { data: allData, error: allError } = await supabase
          .from('tailgrab_nutra_eua_sms_TC')
          .select('created_at, event')
          .gte('created_at', from)
          .lte('created_at', to)

        if (allError) throw allError

        const all = allData ?? []

        // ── SUMMARY ──
        setSummary({
          total:        all.length,
          infoReceived: all.filter(r => r.event === 'InfoReceived').length,
          delivered:    all.filter(r => r.event === 'Delivered').length,
          failed:       all.filter(r => r.event === 'FailedAttempt').length,
        })

        // ── CHART DATA (agrupado por dia) ──
        const dayMap: Record<string, { infoReceived: number; delivered: number; failed: number }> = {}
        all.forEach(r => {
          const day = r.created_at.slice(0, 10)
          if (!dayMap[day]) dayMap[day] = { infoReceived: 0, delivered: 0, failed: 0 }
          if (r.event === 'InfoReceived')  dayMap[day].infoReceived++
          if (r.event === 'Delivered')     dayMap[day].delivered++
          if (r.event === 'FailedAttempt') dayMap[day].failed++
        })
        const chart: TrackingChartPoint[] = Object.entries(dayMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, vals]) => ({ date, ...vals }))
        setChartData(chart)

        // ── TABELA PAGINADA (com filtro de evento) ──
        let q = supabase
          .from('tailgrab_nutra_eua_sms_TC')
          .select('created_at, email, product, event, slug')
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: false })

        if (eventFilter && eventFilter !== 'Todos') {
          q = q.eq('event', eventFilter)
        }

        // Total filtrado para paginação
        const filteredCount = (!eventFilter || eventFilter === 'Todos')
          ? all.length
          : all.filter(r => r.event === eventFilter).length
        setTotalPages(Math.max(1, Math.ceil(filteredCount / PER_PAGE)))

        q = q.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

        const { data, error } = await q
        if (error) throw error

        setRows(
          (data ?? []).map(r => ({
            key:     `${r.created_at}-${r.email}`,
            date:    r.created_at,
            email:   r.email   ?? '—',
            product: r.product ?? '—',
            event:   r.event   ?? '—',
            slug:    r.slug    ?? '—',
          }))
        )
      } catch (e) {
        console.error(e)
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateFrom, dateTo, eventFilter, page])

  return { rows, summary, chartData, totalPages, loading }
}
