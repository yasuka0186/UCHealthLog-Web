import { useEffect, useState, type FormEvent } from 'react'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { PageShell } from '../components/layout/PageShell'
import { MealPhotoPicker } from '../components/photos/MealPhotoPicker'
import { RecordFields } from '../components/records/RecordFields'
import { recordRepository, type RecordRepository } from '../db/recordRepository'
import { createDefaultRecordDraft } from '../domain/record'
import {
  MEAL_PHOTO_TYPES,
  type HealthRecordDraft,
  type HealthRecordRow,
  type MealPhotoDraft,
  type MealPhotoRow,
  type MealPhotoType,
} from '../domain/types'
import { formatJapaneseDate, toDateKey } from '../utils/date'

interface HomePageProps {
  repository?: RecordRepository
  getToday?: () => Date
}

type PhotoDrafts = Partial<Record<MealPhotoType, MealPhotoDraft>>

export function HomePage({
  repository = recordRepository,
  getToday = () => new Date(),
}: HomePageProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(getToday()))
  const [draft, setDraft] = useState<HealthRecordDraft>(() =>
    createDefaultRecordDraft(toDateKey(getToday())),
  )
  const [records, setRecords] = useState<HealthRecordRow[]>([])
  const [existingPhotos, setExistingPhotos] = useState<MealPhotoRow[]>([])
  const [photoDrafts, setPhotoDrafts] = useState<PhotoDrafts>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  useEffect(() => {
    let active = true
    Promise.all([repository.listAll(), repository.getByDateKey(selectedDateKey)])
      .then(async ([nextRecords, record]) => {
        const photos = record ? await repository.getPhotos(record.id) : []
        if (!active) return
        setRecords(nextRecords)
        setDraft(record ? { ...record } : createDefaultRecordDraft(selectedDateKey))
        setExistingPhotos(photos)
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
  }, [repository, selectedDateKey])

  const selectDate = (dateKey: string) => {
    setDraft(createDefaultRecordDraft(dateKey))
    setExistingPhotos([])
    setPhotoDrafts({})
    setMessage(undefined)
    setError(undefined)
    setSelectedDateKey(dateKey)
  }

  const changePhoto = (type: MealPhotoType, photo: MealPhotoDraft | undefined) => {
    setError(undefined)
    setPhotoDrafts((current) => {
      const next = { ...current }
      if (photo) next[type] = photo
      else delete next[type]
      return next
    })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage(undefined)
    setError(undefined)
    try {
      const saved = await repository.save(draft, {
        photos: MEAL_PHOTO_TYPES.flatMap((type) => {
          const photo = photoDrafts[type]
          return photo ? [photo] : []
        }),
      })
      const [nextRecords, photos] = await Promise.all([
        repository.listAll(),
        repository.getPhotos(saved.id),
      ])
      setRecords(nextRecords)
      setDraft({ ...saved })
      setExistingPhotos(photos)
      setPhotoDrafts({})
      setMessage('保存しました。')
    } catch {
      setError('保存できませんでした。入力内容を確認して、もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageShell description="日々の体調を記録し、カレンダーから振り返ります。" title="ホーム"><p role="status">読み込み中…</p></PageShell>
  }

  return (
    <PageShell description="日々の体調を記録し、カレンダーから振り返ります。" title="ホーム">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)]">
        <div className="lg:sticky lg:top-10">
          <MonthCalendar onSelect={selectDate} records={records} selectedDateKey={selectedDateKey} />
        </div>
        <form className="space-y-4" onSubmit={save}>
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h2 className="font-semibold">選択日の記録</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatJapaneseDate(selectedDateKey, true)}</p>
          </section>
          {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200" role="alert">{error}</p>}
          {message && <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" role="status">{message}</p>}
          <RecordFields disabled={saving} draft={draft} onChange={setDraft} />
          <section aria-labelledby="meal-photo-picker-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold" id="meal-photo-picker-heading">食事写真</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">各区分1枚まで保存できます。</p>
            <div className="mt-3 space-y-3">
              {MEAL_PHOTO_TYPES.map((type) => (
                <MealPhotoPicker disabled={saving} existing={existingPhotos.find((photo) => photo.type === type)} key={type} onChange={changePhoto} onError={setError} selected={photoDrafts[type]} type={type} />
              ))}
            </div>
          </section>
          <button className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">
            {saving ? '保存中…' : '保存する'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}
