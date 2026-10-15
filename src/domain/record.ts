import type {
  BloodStatus,
  ConditionStatus,
  HealthRecordDraft,
  MealPhotoType,
  MedicationStatus,
} from './types'

export const CONDITION_LABELS: Record<ConditionStatus, string> = {
  good: '良い',
  normal: '普通',
  bad: '悪い',
}

export const BLOOD_LABELS: Record<BloodStatus, string> = {
  none: 'なし',
  little: '少し',
  exists: 'あり',
}

export const MEDICATION_LABELS: Record<MedicationStatus, string> = {
  taken: '飲んだ',
  notTaken: '飲んでいない',
  notEntered: '未入力',
}

export const MEAL_PHOTO_LABELS: Record<MealPhotoType, string> = {
  breakfast: '朝',
  lunch: '昼',
  dinner: '晩',
  snack: '間食',
}

export function createDefaultRecordDraft(dateKey: string): HealthRecordDraft {
  return {
    dateKey,
    condition: 'normal',
    stomachPainLevel: 0,
    toiletCount: 0,
    bloodStatus: 'none',
    medicationStatus: 'notEntered',
    memo: '',
  }
}

