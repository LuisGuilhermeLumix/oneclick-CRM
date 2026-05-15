import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'
import { startOfDayUTC, endOfDayUTC, utcToLocalDateStr, getDaysInRange } from '@/lib/dates'

const TABLE = 'oneclick_info_br_CRM'

const TRACKED_EVENTS = ['abandoned_cart', 'generated_pix', 'refused_card', 'order_paid'] as const
type TrackedEvent = (typeof TRACKED_EVENTS)[number]

export interface ChartPoint {
  date: string
  abandoned_cart: number
  generated_pix: number
  refused_card: number
  order_paid: number
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
          .select('created_at, "Event"')
          .gte('created_at', startOfDayUTC(dateFrom))
          .lte('created_at', endOfDayUTC(dateTo))
          .in('Event', TRACKED_EVENTS as unknown as string[])

        if (product && product !== 'Todos') q = q.eq('product', product)

        const { data: rows, error } = await q
        if (error) throw error

        const map: Record<string, ChartPoint> = {}
        for (const day of getDaysInRange(dateFrom, dateTo)) {
          map[day] = { date: day, abandoned_cart: 0, generated_pix: 0, refused_card: 0, order_paid: 0 }
        }
        ;((rows ?? []) as Array<{ created_at: string; Event: TrackedEvent }>).forEach((r) => {
          const day = utcToLocalDateStr(r.created_at)
          if (!map[day]) {
            map[day] = { date: day, abandoned_cart: 0, generated_pix: 0, refused_card: 0, order_paid: 0 }
          }
          if (r.Event && (TRACKED_EVENTS as readonly string[]).includes(r.Event)) {
            map[day][r.Event]++
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
