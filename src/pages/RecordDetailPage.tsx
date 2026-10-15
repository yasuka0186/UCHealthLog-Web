import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PageShell } from '../components/layout/PageShell'
import { MealPhotoGallery } from '../components/photos/MealPhotoGallery'
import { DeleteConfirmDialog } from '../components/records/DeleteConfirmDialog'
import { RecordFields } from '../components/records/RecordFields'
import { recordRepository, type RecordRepository } from '../db/recordRepository'
import type { HealthRecordDraft, HealthRecordRow, MealPhotoRow } from '../domain/types'
import { formatJapaneseDate } from '../utils/date'

interface RecordDetailPageProps {
  repository?: RecordRepository
}

export function RecordDetailPage({ repository = recordRepository }: RecordDetailPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<HealthRecordRow>()
  const [draft, setDraft] = useState<HealthRecordDraft>()
  const [photos, setPhotos] = useState<MealPhotoRow[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    if (!id) return
    repository.getById(id)
      .then(async (nextRecord) => {
        if (!nextRecord) {
          if (active) setNotFound(true)
          return
        }
        const nextPhotos = await repository.getPhotos(nextRecord.id)
        if (!active) return
        setRecord(nextRecord)
        setDraft({ ...nextRecord })
        setPhotos(nextPhotos)
      })
      .catch(() => {
        if (active) setError('記録を読み込めませんでした。もう一度お試しください。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, repository])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft || saving) return
    setSaving(true)
    setMessage(undefined)
    setError(undefined)
    try {
      const saved = await repository.save(draft)
      setRecord(saved)
      setDraft({ ...saved })
      setMessage('変更を保存しました。')
    } catch {
      setError('変更を保存できませんでした。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  const cancelDelete = useCallback(() => setConfirmingDelete(false), [])

  const deleteRecord = async () => {
    if (!record || deleting) return
    setDeleting(true)
    setError(undefined)
    try {
      await repository.delete(record.id)
      navigate('/history', { replace: true })
    } catch {
      setConfirmingDelete(false)
      setError('記録を削除できませんでした。もう一度お試しください。')
      setDeleting(false)
    }
  }

  if (!id || notFound) {
    return (
      <PageShell description="指定された記録は見つかりませんでした。" title="記録が見つかりません">
        <Link className="inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300" to="/history">履歴へ戻る</Link>
      </PageShell>
    )
  }

  if (loading) {
    return <PageShell description="選択した日の体調記録を確認します。" title="記録詳細"><p role="status">読み込み中…</p></PageShell>
  }

  if (!record || !draft) {
    return <PageShell description="選択した日の体調記録を確認します。" title="記録詳細"><p role="alert">{error ?? '記録を表示できません。'}</p></PageShell>
  }

  return (
    <PageShell description="選択した日の体調記録を確認します。" title="記録詳細">
      <form className="space-y-4" onSubmit={save}>
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <h2 className="font-semibold">記録日</h2>
          <p className="mt-1">{formatJapaneseDate(record.dateKey, true)}</p>
        </section>
        {error && <p className="rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" role="status">{message}</p>}
        <RecordFields disabled={saving || deleting} draft={draft} onChange={setDraft} />
        <MealPhotoGallery photos={photos} />
        <button className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60" disabled={saving || deleting} type="submit">{saving ? '保存中…' : '変更を保存する'}</button>
        <button className="min-h-12 w-full rounded-2xl border border-red-300 px-5 py-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950" disabled={saving || deleting} onClick={() => setConfirmingDelete(true)} type="button">この記録を削除</button>
      </form>
      <Link className="mt-6 inline-flex min-h-11 items-center font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-300" to="/history">履歴へ戻る</Link>
      <DeleteConfirmDialog deleting={deleting} onCancel={cancelDelete} onConfirm={() => void deleteRecord()} open={confirmingDelete} />
    </PageShell>
  )
}
