import type { HealthRecordRow } from './types'
import { addLocalDays, toDateKey } from '../utils/date'

export const GRAPH_PERIODS = [7, 14, 30] as const
export type GraphPeriod = (typeof GRAPH_PERIODS)[number]

export interface GraphStatistics {
  average: number
  maximum: number
  minimum: number
}

export function filterRecordsForGraph(
  records: readonly HealthRecordRow[],
  period: GraphPeriod,
  today = new Date(),
): HealthRecordRow[] {
  const todayKey = toDateKey(today)
  const startKey = toDateKey(addLocalDays(today, -(period - 1)))

  return records
    .filter(({ dateKey }) => dateKey >= startKey && dateKey <= todayKey)
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
}

export function calculateGraphStatistics(
  records: readonly HealthRecordRow[],
): GraphStatistics | null {
  if (records.length === 0) return null

  const counts = records.map(({ toiletCount }) => toiletCount)
  const total = counts.reduce((sum, count) => sum + count, 0)
  return {
    average: total / counts.length,
    maximum: Math.max(...counts),
    minimum: Math.min(...counts),
  }
}

export function graphAxisInterval(period: GraphPeriod): number {
  if (period === 7) return 0
  if (period === 14) return 1
  return 4
}
