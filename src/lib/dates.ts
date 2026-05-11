function getLocalDateStr(date: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

export function utcToLocalDateStr(utcStr: string): string {
  const date = new Date(utcStr)
  return getLocalDateStr(date)
}

export function todayStr(): string {
  return getLocalDateStr(new Date())
}

export function daysAgoStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return getLocalDateStr(d)
}

export function firstOfMonthStr(): string {
  const d = new Date()
  d.setDate(1)
  return getLocalDateStr(d)
}

export function startOfDayUTC(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString()
}

export function endOfDayUTC(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}

export function getDaysInRange(fromStr: string, toStr: string): string[] {
  const days: string[] = []
  const cur = new Date(`${fromStr}T12:00:00`)
  const end = new Date(`${toStr}T12:00:00`)
  while (cur <= end) {
    days.push(getLocalDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}
