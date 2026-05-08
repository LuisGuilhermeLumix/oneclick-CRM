import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProducts() {
  const [products, setProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('obliviumdigital_nutra_br_CRM')
          .select('product')
          .not('product', 'is', null)
          .limit(5000)

        if (error) throw error
        if (cancelled) return

        const set = new Set<string>()
        ;((data ?? []) as Array<{ product: string | null }>).forEach((r) => {
          if (r.product) set.add(r.product)
        })
        setProducts(Array.from(set).sort((a, b) => a.localeCompare(b)))
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading }
}
