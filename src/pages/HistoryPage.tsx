import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PageShell } from '../components/layout/PageShell'
import { StatusBadge } from '../components/records/StatusBadge'
import { recordRepository, type RecordRepository } from '../db/recordRepository'
import { BLOOD_LABELS, MEDICATION_LABELS } from '../domain/record'
import type { HealthRecordRow } from '../domain/types'
import { formatJapaneseDate } from '../utils/date'

interface HistoryPageProps {
  repository?: RecordRepository
}

export function HistoryPage({ repository = recordRepository }: HistoryPageProps) {
  const [records, setRecords] = useState<HealthRecordRow[]>([])
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

  return (
    <PageShell description="これまでに保存した記録を確認します。" title="履歴">
      {loading && <p role="status">読み込み中…</p>}
      {!loading && error && <p className="rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200" role="alert">履歴を読み込めませんでした。もう一度ページを開いてください。</p>}
      {!loading && !error && records.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">記録はまだありません</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">ホームで体調を保存すると、ここに表示されます。</p>
        </div>
      )}
      {!loading && !error && records.length > 0 && (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.id}>
              <Link className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900" to={`/history/${record.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{formatJapaneseDate(record.dateKey)}</h2>
                  <StatusBadge condition={record.condition} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div><dt className="text-slate-500 dark:text-slate-400">腹痛</dt><dd className="font-medium">レベル {record.stomachPainLevel}</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">トイレ</dt><dd className="font-medium">{record.toiletCount}回</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">血便</dt><dd className="font-medium">{BLOOD_LABELS[record.bloodStatus]}</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">服薬</dt><dd className="font-medium">{MEDICATION_LABELS[record.medicationStatus]}</dd></div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
