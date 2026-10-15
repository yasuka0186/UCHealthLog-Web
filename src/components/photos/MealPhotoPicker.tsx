import { useState, type ChangeEvent } from 'react'
import { MEAL_PHOTO_LABELS } from '../../domain/record'
import type { MealPhotoDraft, MealPhotoRow, MealPhotoType } from '../../domain/types'
import { fileToMealPhotoDraft } from '../../services/photoService'
import { PhotoImage } from './PhotoImage'

interface MealPhotoPickerProps {
  type: MealPhotoType
  selected?: MealPhotoDraft
  existing?: MealPhotoRow
  disabled?: boolean
  onChange: (type: MealPhotoType, draft: MealPhotoDraft | undefined) => void
  onError: (message: string) => void
}

export function MealPhotoPicker({
  type,
  selected,
  existing,
  disabled = false,
  onChange,
  onError,
}: MealPhotoPickerProps) {
  const [processing, setProcessing] = useState(false)
  const label = MEAL_PHOTO_LABELS[type]
  const preview = selected?.blob ?? existing?.blob

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setProcessing(true)
    try {
      onChange(type, await fileToMealPhotoDraft(file, type))
    } catch (error) {
      onError(error instanceof Error ? error.message : '写真を読み込めませんでした。')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 dark:bg-blue-950 dark:text-blue-300">
          {processing ? '圧縮中…' : preview ? '写真を変更' : '写真を選択'}
          <input
            accept="image/*"
            aria-label={`${label}の写真を選択`}
            className="sr-only"
            disabled={disabled || processing}
            onChange={handleFile}
            type="file"
          />
        </label>
      </div>
      {preview && (
        <div className="mt-3">
          <PhotoImage alt={`${label}の食事写真プレビュー`} blob={preview} className="h-32 w-full rounded-xl object-cover" />
          {selected && (
            <button
              className="mt-2 min-h-11 text-sm font-semibold text-red-700 underline-offset-4 hover:underline dark:text-red-300"
              disabled={disabled}
              onClick={() => onChange(type, undefined)}
              type="button"
            >
              選択を解除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

