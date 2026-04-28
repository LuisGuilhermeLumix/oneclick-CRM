import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilters } from './useFilters'

const TABLE = 'gabriel_info_eua_CRM'

export type LeadStatus = 'Recuperado' | 'Disparado' | 'Pendente'

export interface LeadRow {
  id: string
  date: string
  name: string
  email: string
  product: string
  channel: 'SMS' | 'Email'
  recoveredValue: number
  status: LeadStatus
}

const PER_PAGE = 20

function parseDollar(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

export function useLeads(tab: 'Todos' | 'SMS' | 'Email', search: string, page: number) {
  const { dateFrom, dateTo, product } = useFilters()
  const [rows, setRows] = useState<LeadRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const from = `${dateFrom}T00:00:00.000Z`
        const to = `${dateTo}T23:59:59.999Z`

        let q = supabase
          .from(TABLE)
          .select('id, created_at, name, email, product, utm_source, "Event", "($)"')
          .gte('created_at', from)
          .lte('created_at', to)
          .eq('Event', 'order_paid')
          .in('utm_source', ['SMS', 'EMAIL'])
          .order('created_at', { ascending: false })

        if (tab === 'SMS') q = q.eq('utm_source', 'SMS')
        if (tab === 'Email') q = q.eq('utm_source', 'EMAIL')
        if (product && product !== 'Todos') q = q.eq('product', product)
        if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`)

        const { data, error } = await q
        if (error) throw error

        const all = (data ?? []) as any[]
        setTotalPages(Math.max(1, Math.ceil(all.length / PER_PAGE)))

        const paged: LeadRow[] = all
          .slice((page - 1) * PER_PAGE, page * PER_PAGE)
          .map((r) => ({
            id: String(r.id),
            date: r.created_at,
            name: r.name ?? '—',
            email: r.email ?? '—',
            product: r.product ?? '—',
            channel: (r.utm_source === 'SMS' ? 'SMS' : 'Email') as 'SMS' | 'Email',
            recoveredValue: parseDollar(r['($)']),
            status: 'Recuperado' as LeadStatus,
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
  }, [dateFrom, dateTo, tab, search, page, product])

  return { rows, totalPages, loading }
}
