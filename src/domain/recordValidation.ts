import {
  BLOOD_STATUSES,
  CONDITION_STATUSES,
  MEAL_PHOTO_TYPES,
  MEDICATION_STATUSES,
  type BloodStatus,
  type ConditionStatus,
  type HealthRecordDraft,
  type HealthRecordRow,
  type MealPhotoDraft,
  type MealPhotoRow,
  type MealPhotoType,
  type MedicationStatus,
} from './types'
import { isValidDateKey } from '../utils/date'

export class ValidationError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super(issues.join(' '))
    this.name = 'ValidationError'
    this.issues = issues
  }
}

function isOneOf<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T {
  return typeof value === 'string' && allowedValues.includes(value as T)
}

export function isConditionStatus(value: unknown): value is ConditionStatus {
  return isOneOf(value, CONDITION_STATUSES)
}

export function isBloodStatus(value: unknown): value is BloodStatus {
  return isOneOf(value, BLOOD_STATUSES)
}

export function isMedicationStatus(value: unknown): value is MedicationStatus {
  return isOneOf(value, MEDICATION_STATUSES)
}

export function isMealPhotoType(value: unknown): value is MealPhotoType {
  return isOneOf(value, MEAL_PHOTO_TYPES)
}

export function validateHealthRecordDraft(
  value: unknown,
): asserts value is HealthRecordDraft {
  const issues: string[] = []

  if (typeof value !== 'object' || value === null) {
    throw new ValidationError(['記録はオブジェクトで指定してください。'])
  }

  const record = value as Record<string, unknown>
  if (!isValidDateKey(record.dateKey)) issues.push('dateKeyが不正です。')
  if (!isConditionStatus(record.condition)) issues.push('体調が不正です。')
  if (
    !Number.isInteger(record.stomachPainLevel) ||
    typeof record.stomachPainLevel !== 'number' ||
    record.stomachPainLevel < 0 ||
    record.stomachPainLevel > 5
  ) {
    issues.push('腹痛レベルは0〜5の整数で指定してください。')
  }
  if (
    !Number.isInteger(record.toiletCount) ||
    typeof record.toiletCount !== 'number' ||
    record.toiletCount < 0
  ) {
    issues.push('トイレ回数は0以上の整数で指定してください。')
  }
  if (!isBloodStatus(record.bloodStatus)) issues.push('血便の状態が不正です。')
  if (!isMedicationStatus(record.medicationStatus)) {
    issues.push('服薬の状態が不正です。')
  }
  if (typeof record.memo !== 'string') issues.push('メモが不正です。')

  if (issues.length > 0) throw new ValidationError(issues)
}

export function validateMealPhotoDraft(
  value: unknown,
): asserts value is MealPhotoDraft {
  const issues: string[] = []

  if (typeof value !== 'object' || value === null) {
    throw new ValidationError(['食事写真はオブジェクトで指定してください。'])
  }

  const photo = value as Record<string, unknown>
  if (!isMealPhotoType(photo.type)) issues.push('食事区分が不正です。')
  if (!(photo.blob instanceof Blob)) issues.push('写真データが不正です。')
  if (typeof photo.mimeType !== 'string' || photo.mimeType.trim() === '') {
    issues.push('MIME typeは必須です。')
  }

  if (issues.length > 0) throw new ValidationError(issues)
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export function validateHealthRecordRow(
  value: unknown,
): asserts value is HealthRecordRow {
  validateHealthRecordDraft(value)
  const row = value as unknown as Record<string, unknown>
  const issues: string[] = []
  if (!isUuid(row.id)) issues.push('記録IDが不正です。')
  if (!isIsoDateTime(row.createdAt)) issues.push('作成日時が不正です。')
  if (!isIsoDateTime(row.updatedAt)) issues.push('更新日時が不正です。')
  if (issues.length > 0) throw new ValidationError(issues)
}

export function validateMealPhotoRow(
  value: unknown,
): asserts value is MealPhotoRow {
  validateMealPhotoDraft(value)
  const row = value as unknown as Record<string, unknown>
  const issues: string[] = []
  if (!isUuid(row.id)) issues.push('写真IDが不正です。')
  if (!isUuid(row.recordId)) issues.push('写真の記録IDが不正です。')
  if (!isIsoDateTime(row.createdAt)) issues.push('写真の作成日時が不正です。')
  if (issues.length > 0) throw new ValidationError(issues)
}

