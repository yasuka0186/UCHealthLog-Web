import { MEAL_PHOTO_LABELS } from '../../domain/record'
import type { MealPhotoRow } from '../../domain/types'
import { PhotoImage } from './PhotoImage'

interface MealPhotoGalleryProps {
  photos: readonly MealPhotoRow[]
}

export function MealPhotoGallery({ photos }: MealPhotoGalleryProps) {
  if (photos.length === 0) return null

  return (
    <section aria-labelledby="meal-photo-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-semibold" id="meal-photo-heading">食事写真</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <figure key={photo.id}>
            <figcaption className="mb-1 text-sm font-medium">{MEAL_PHOTO_LABELS[photo.type]}</figcaption>
            <PhotoImage alt={`${MEAL_PHOTO_LABELS[photo.type]}の食事写真`} blob={photo.blob} className="h-32 w-full rounded-xl object-cover" />
          </figure>
        ))}
      </div>
    </section>
  )
}

