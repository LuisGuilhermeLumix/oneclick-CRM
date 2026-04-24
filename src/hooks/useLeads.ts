import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'

export interface LeadRow {
  id: string
  date: string
  name: string
  number: string
  email: string
  product: string
  channel: 'SMS' | 'Email'
  value: number
  status: 'Recuperado'
}

const PER_PAGE = 8

function parseDollar(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

export function useLeads(tab: 'Todos' | 'SMS' | 'Email', search: string, page: number) {
  const { dateFrom, dateTo } = useFilters()
  const [rows, setRows]           = useState<LeadRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const from = `${dateFrom}T00:00:00.000Z`
        const to   = `${dateTo}T23:59:59.999Z`

        let q = supabase
          .from('tailgrab_nutra_eua_CRM')
          .select('id, created_at, name, number, email, product, utm_source, "($)"')
          .gte('created_at', from)
          .lte('created_at', to)
          .eq('Event', 'order_paid')
          .in('utm_source', ['SMS', 'EMAIL'])
          .order('created_at', { ascending: false })

        if (tab === 'SMS')   q = q.eq('utm_source', 'SMS')
        if (tab === 'Email') q = q.eq('utm_source', 'EMAIL')

        if (search) q = q.or(`email.ilike.%${search}%,number.ilike.%${search}%`)

        const { data, error } = await q
        if (error) throw error

        const all = (data ?? []) as any[]
        setTotalPages(Math.max(1, Math.ceil(all.length / PER_PAGE)))

        const paged: LeadRow[] = all
          .slice((page - 1) * PER_PAGE, page * PER_PAGE)
          .map((r) => ({
            id:      String(r.id),
            date:    r.created_at,
            name:    r.name    ?? '—',
            number:  r.number  ?? '—',
            email:   r.email   ?? '—',
            product: r.product ?? '—',
            channel: (r.utm_source === 'SMS' ? 'SMS' : 'Email') as 'SMS' | 'Email',
            value:   parseDollar(r['($)']),
            status:  'Recuperado' as const,
          }))

        setRows(paged)
      } catch (e) {
        console.error(e)
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateFrom, dateTo, tab, search, page])

  return { rows, totalPages, loading }
}
