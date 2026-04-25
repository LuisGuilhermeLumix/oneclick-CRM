import { create } from 'zustand'

export type Channel = 'Todos' | 'SMS' | 'Email'
export type RangeKey = 'hoje' | '7d' | 'mes' | '90d' | 'custom'

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

const today = new Date()
const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)

interface FiltersState {
  dateFrom: string
  dateTo: string
  channel: Channel
  activeRange: RangeKey
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setChannel: (v: Channel) => void
  setRange: (key: 'hoje' | '7d' | 'mes' | '90d') => void
}

export const useFilters = create<FiltersState>((set) => ({
  dateFrom: toDateStr(defaultFrom),
  dateTo: toDateStr(today),
  channel: 'Todos',
  activeRange: 'mes',
  setDateFrom: (v) => set({ dateFrom: v, activeRange: 'custom' }),
  setDateTo: (v) => set({ dateTo: v, activeRange: 'custom' }),
  setChannel: (v) => set({ channel: v }),
  setRange: (key) => {
    const to = new Date()
    const from = new Date()

    if (key === 'hoje') {
      // from e to = hoje (ambos já estão como hoje)
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
