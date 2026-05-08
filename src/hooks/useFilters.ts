import { create } from 'zustand'

export type RangeKey = 'hoje' | '7d' | 'mes' | '90d' | 'custom'

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

const today = new Date()
const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)

interface FiltersState {
  dateFrom: string
  dateTo: string
  product: string
  activeRange: RangeKey
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setProduct: (v: string) => void
  setRange: (key: 'hoje' | '7d' | 'mes' | '90d') => void
}

export const useFilters = create<FiltersState>((set) => ({
  dateFrom: toDateStr(defaultFrom),
  dateTo: toDateStr(today),
  product: 'Todos',
  activeRange: 'mes',
  setDateFrom: (v) => set({ dateFrom: v, activeRange: 'custom' }),
  setDateTo: (v) => set({ dateTo: v, activeRange: 'custom' }),
  setProduct: (v) => set({ product: v }),
  setRange: (key) => {
    const to = new Date()
    const from = new Date()

    if (key === 'hoje') {
      // from e to = hoje
    } else if (key === '7d') {
      from.setDate(to.getDate() - 7)
    } else if (key === 'mes') {
      from.setDate(1)
    } else if (key === '90d') {
      from.setDate(to.getDate() - 90)
    }

    set({
      dateFrom: toDateStr(from),
      dateTo: toDateStr(to),
      activeRange: key,
    })
  },
}))
