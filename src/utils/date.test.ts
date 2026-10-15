import { describe, expect, it } from 'vitest'
import { isValidDateKey, toDateKey } from './date'

describe('toDateKey', () => {
  it('ローカル日付をYYYY-MM-DD形式にする', () => {
    expect(toDateKey(new Date(2026, 7, 7, 12, 30))).toBe('2026-08-07')
  })

  it('ローカル日の開始・終了付近でも日付をずらさない', () => {
    expect(toDateKey(new Date(2026, 0, 2, 0, 0, 1))).toBe('2026-01-02')
    expect(toDateKey(new Date(2026, 0, 2, 23, 59, 59))).toBe('2026-01-02')
  })

  it('無効なDateを拒否する', () => {
    expect(() => toDateKey(new Date(Number.NaN))).toThrow(RangeError)
  })

  it('YYYYで表現できない年を拒否する', () => {
    const date = new Date(0)
    date.setFullYear(10_000)
    expect(() => toDateKey(date)).toThrow(RangeError)
  })
})

describe('isValidDateKey', () => {
  it.each(['2024-02-29', '2026-08-07'])('%sを有効と判定する', (value) => {
    expect(isValidDateKey(value)).toBe(true)
  })

  it.each(['2023-02-29', '2026-13-01', '2026-04-31', '2026-8-07', '']) (
    '%sを拒否する',
    (value) => {
      expect(isValidDateKey(value)).toBe(false)
    },
  )
})
