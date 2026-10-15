import type { MealPhotoType } from '../domain/types'

export interface MealPhotoStorageRow {
  id: string
  recordId: string
  type: MealPhotoType
  data: ArrayBuffer
  mimeType: string
  createdAt: string
}

export interface LegacyMealPhotoStorageRow {
  id: string
  recordId: string
  type: MealPhotoType
  blob: Blob
  mimeType: string
  createdAt: string
}
