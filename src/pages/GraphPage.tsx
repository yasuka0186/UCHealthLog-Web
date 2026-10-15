import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageShell } from '../components/layout/PageShell'
import { recordRepository, type RecordRepository } from '../db/recordRepository'
import {
  calculateGraphStatistics,
  filterRecordsForGraph,
  graphAxisInterval,
  GRAPH_PERIODS,
  type GraphPeriod,
} from '../domain/graph'
import type { HealthRecordRow } from '../domain/types'
import { formatChartDate } from '../utils/date'

interface GraphPageProps {
  repository?: RecordRepository
  getToday?: () => Date
}

export function GraphPage({ repository = recordRepository, getToday = () => new Date() }: GraphPageProps) {
  const [records, setRecords] = useState<HealthRecordRow[]>([])
  const [period, setPeriod] = useState<GraphPeriod>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    repository.listAll()
      .then((nextRecords) => {
        if (active) setRecords(nextRecords)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [repository])

  const filtered = useMemo(
    () => filterRecordsForGraph(records, period, getToday()),
    [getToday, period, records],
  )
  const statistics = useMemo(() => calculateGraphStatistics(filtered), [filtered])
  const chartData = filtered.map((record) => ({
    date: formatChartDate(record.dateKey),
    toiletCount: record.toiletCount,
  }))

  return (
    <PageShell description="トイレ回数の変化を期間ごとに振り返ります。" title="グラフ">
      <fieldset>
        <legend className="sr-only">表示期間</legend>
        <div className="grid grid-cols-3 rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
          {GRAPH_PERIODS.map((candidate) => (
            <label className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg font-semibold ${period === candidate ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`} key={candidate}>
              <input checked={period === candidate} className="sr-only" name="graphPeriod" onChange={() => setPeriod(candidate)} type="radio" value={candidate} />
              {candidate}日
            </label>
          ))}
        </div>
      </fieldset>

      {loading && <p className="mt-6" role="status">読み込み中…</p>}
      {!loading && error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200" role="alert">グラフを読み込めませんでした。もう一度ページを開いてください。</p>}
      {!loading && !error && filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">表示できる記録がありません</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">ホームで体調記録を保存すると、ここにグラフが表示されます。</p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && statistics && (
        <>
          <section aria-label="トイレ回数グラフ" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold">トイレ回数</h2>
            <div className="mt-4 h-64 min-w-0" role="img" aria-label={`${period}日間のトイレ回数折れ線グラフ`}>
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={chartData} margin={{ left: -16, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" interval={graphAxisInterval(period)} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} width={36} />
                  <Tooltip formatter={(value) => [`${String(value)}回`, 'トイレ回数']} />
                  <Line dataKey="toiletCount" dot stroke="#2563eb" strokeWidth={3} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-900"><dt className="text-sm text-slate-500 dark:text-slate-400">平均</dt><dd className="mt-1 font-bold">{statistics.average.toFixed(1)}回</dd></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-900"><dt className="text-sm text-slate-500 dark:text-slate-400">最高</dt><dd className="mt-1 font-bold">{statistics.maximum}回</dd></div>
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-900"><dt className="text-sm text-slate-500 dark:text-slate-400">最低</dt><dd className="mt-1 font-bold">{statistics.minimum}回</dd></div>
          </dl>
        </>
      )}
      <aside className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700 dark:border-blue-950 dark:bg-blue-950 dark:text-slate-200">
        トイレ回数が普段より増えている日は、体調・血便・メモもあわせて確認しましょう。
      </aside>
    </PageShell>
  )
}
