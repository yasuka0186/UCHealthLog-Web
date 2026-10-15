import { describe, expect, it } from 'vitest'
import type { HealthRecordRow } from './types'
import {
  calculateGraphStatistics,
  filterRecordsForGraph,
  graphAxisInterval,
} from './graph'

function record(dateKey: string, toiletCount: number): HealthRecordRow {
  return {
    id: crypto.randomUUID(),
    dateKey,
    condition: 'normal',
    stomachPainLevel: 0,
    toiletCount,
    bloodStatus: 'none',
    medicationStatus: 'notEntered',
    memo: '',
    createdAt: '2026-08-07T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
  }
}

describe('filterRecordsForGraph', () => {
  const today = new Date(2026, 7, 7, 12)
  const records = [
    record('2026-07-09', 1),
    record('2026-07-10', 2),
    record('2026-07-25', 3),
    record('2026-08-01', 4),
    record('2026-08-07', 5),
    record('2026-08-08', 99),
  ]

  it('今日を含む直近7日を古い順に抽出し、未来日を除外する', () => {
    expect(filterRecordsForGraph(records, 7, today).map(({ dateKey }) => dateKey)).toEqual([
      '2026-08-01',
      '2026-08-07',
    ])
  })

  it('14日と30日の範囲を抽出する', () => {
    expect(filterRecordsForGraph(records, 14, today).map(({ dateKey }) => dateKey)).toEqual([
      '2026-07-25',
      '2026-08-01',
      '2026-08-07',
    ])
    expect(filterRecordsForGraph(records, 30, today).map(({ dateKey }) => dateKey)).toEqual([
      '2026-07-09',
      '2026-07-10',
      '2026-07-25',
      '2026-08-01',
      '2026-08-07',
    ])
  })
})

describe('calculateGraphStatistics', () => {
  it('平均・最高・最低を計算する', () => {
    expect(calculateGraphStatistics([
      record('2026-08-05', 2),
      record('2026-08-06', 3),
      record('2026-08-07', 5),
    ])).toEqual({ average: 10 / 3, maximum: 5, minimum: 2 })
  })

  it('0件ならnullを返す', () => {
    expect(calculateGraphStatistics([])).toBeNull()
  })

  it('期間別の軸ラベル間隔を返す', () => {
    expect(graphAxisInterval(7)).toBe(0)
    expect(graphAxisInterval(14)).toBe(1)
    expect(graphAxisInterval(30)).toBe(4)
  })
})
