/** A local Gregorian date in YYYY-MM-DD form. */
export type LocalDate = string
export type UtcTimestamp = string

const formatters = new Map<string, Intl.DateTimeFormat>()

export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function localDateAt(instant: Date, timeZone: string): LocalDate {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone, calendar: 'gregory', numberingSystem: 'latn',
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
    formatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]))
  return `${parts.year?.padStart(4, '0')}-${parts.month}-${parts.day}`
}

function calendarDate(date: LocalDate): Date {
  return new Date(`${date}T12:00:00Z`)
}

export function isLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const date = calendarDate(value)
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

export function shiftDate(date: LocalDate, amount: number): LocalDate {
  const day = calendarDate(date)
  day.setUTCDate(day.getUTCDate() + amount)
  return day.toISOString().slice(0, 10)
}

export function isoWeekday(date: LocalDate): number {
  return calendarDate(date).getUTCDay() || 7
}

export function formatDate(date: LocalDate, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(calendarDate(date))
}
