import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'
import { startOfDayUTC, endOfDayUTC, utcToLocalDateStr, getDaysInRange } from '@/lib/dates'
import { getLeadOrigin } from '@/lib/events'

const TABLE = 'oneclick_info_br_CRM'

export interface ChartPoint {
  date: string
  AC: number
  GP: number
  RC: number
}

export function useChartData() {
  const { dateFrom, dateTo, product } = useFilters()
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let q = supabase
          .from(TABLE)
          .select('created_at, utm_source')
          .gte('created_at', startOfDayUTC(dateFrom))
          .lte('created_at', endOfDayUTC(dateTo))
          .eq('Event', 'order_paid')
          .like('utm_source', '%WPP%')

        if (product && product !== 'Todos') q = q.eq('product', product)

        const { data: rows, error } = await q
        if (error) throw error

        const map: Record<string, ChartPoint> = {}
        for (const day of getDaysInRange(dateFrom, dateTo)) {
          map[day] = { date: day, AC: 0, GP: 0, RC: 0 }
        }
        ;((rows ?? []) as Array<{ created_at: string; utm_source: string | null }>).forEach((r) => {
          const day = utcToLocalDateStr(r.created_at)
          if (!map[day]) map[day] = { date: day, AC: 0, GP: 0, RC: 0 }
          const origin = getLeadOrigin(r.utm_source)
          if (origin === 'AC' || origin === 'GP' || origin === 'RC') {
            map[day][origin]++
          }
        })

        const points: ChartPoint[] = Object.values(map).sort((a, b) =>
          a.date.localeCompare(b.date),
        )

        setData(points)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateFrom, dateTo, product])

  return { data, loading }
}
