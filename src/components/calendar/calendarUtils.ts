import { addLocalDays } from '../../utils/date'

export function getCalendarDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = addLocalDays(first, -first.getDay())
  const end = addLocalDays(last, 6 - last.getDay())
  const days: Date[] = []

  for (let current = start; current <= end; current = addLocalDays(current, 1)) {
    days.push(current)
  }
  return days
}
