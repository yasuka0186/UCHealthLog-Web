export const CONDITION_STATUSES = ['good', 'normal', 'bad'] as const
export const BLOOD_STATUSES = ['none', 'little', 'exists'] as const
export const MEDICATION_STATUSES = ['taken', 'notTaken', 'notEntered'] as const
export const MEAL_PHOTO_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export type ConditionStatus = (typeof CONDITION_STATUSES)[number]
export type BloodStatus = (typeof BLOOD_STATUSES)[number]
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number]
export type MealPhotoType = (typeof MEAL_PHOTO_TYPES)[number]

export interface HealthRecordRow {
  id: string
  dateKey: string
  condition: ConditionStatus
  stomachPainLevel: number
  toiletCount: number
  bloodStatus: BloodStatus
  medicationStatus: MedicationStatus
  memo: string
  createdAt: string
  updatedAt: string
}

export interface MealPhotoRow {
  id: string
  recordId: string
  type: MealPhotoType
  blob: Blob
  mimeType: string
  createdAt: string
}

export type HealthRecordDraft = Omit<
  HealthRecordRow,
  'id' | 'createdAt' | 'updatedAt'
>

export interface MealPhotoDraft {
  type: MealPhotoType
  blob: Blob
  mimeType: string
}

