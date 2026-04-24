import { create } from 'zustand'

export type Channel = 'Todos' | 'SMS' | 'Email'
export type RangeKey = '7d' | '30d' | '90d'

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

const today = new Date()
const defaultFrom = new Date()
defaultFrom.setDate(today.getDate() - 30)

interface FiltersState {
  dateFrom: string
  dateTo: string
  channel: Channel
  activeRange: RangeKey
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setChannel: (v: Channel) => void
  setRange: (days: 7 | 30 | 90) => void
}

export const useFilters = create<FiltersState>((set) => ({
  dateFrom: toDateStr(defaultFrom),
  dateTo: toDateStr(today),
  channel: 'Todos',
  activeRange: '30d',
  setDateFrom: (v) => set({ dateFrom: v, activeRange: '30d' }),
  setDateTo: (v) => set({ dateTo: v, activeRange: '30d' }),
  setChannel: (v) => set({ channel: v }),
  setRange: (days) => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - days)
    set({
      dateFrom: toDateStr(from),
      dateTo: toDateStr(to),
      activeRange: `${days}d` as RangeKey,
    })
  },
}))
