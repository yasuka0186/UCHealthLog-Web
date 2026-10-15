import { describe, expect, it } from 'vitest'
import { toDateKey } from '../../utils/date'
import { getCalendarDays } from './calendarUtils'

describe('getCalendarDays', () => {
  it('表示月を含む日曜始まり・土曜終わりの日付を作る', () => {
    const days = getCalendarDays(new Date(2026, 7, 1))

    expect(toDateKey(days[0]!)).toBe('2026-07-26')
    expect(toDateKey(days.at(-1)!)).toBe('2026-09-05')
    expect(days[0]?.getDay()).toBe(0)
    expect(days.at(-1)?.getDay()).toBe(6)
  })
})
