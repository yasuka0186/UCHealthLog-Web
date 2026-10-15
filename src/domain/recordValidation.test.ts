import { describe, expect, it } from 'vitest'
import {
  isBloodStatus,
  isConditionStatus,
  isMealPhotoType,
  isMedicationStatus,
  validateHealthRecordDraft,
  validateMealPhotoDraft,
  ValidationError,
} from './recordValidation'
import type { HealthRecordDraft } from './types'

const validDraft: HealthRecordDraft = {
  dateKey: '2026-08-07',
  condition: 'normal',
  stomachPainLevel: 0,
  toiletCount: 0,
  bloodStatus: 'none',
  medicationStatus: 'notEntered',
  memo: '',
}

describe('status validation', () => {
  it('定義済みenumだけを受け付ける', () => {
    expect(isConditionStatus('good')).toBe(true)
    expect(isConditionStatus('unknown')).toBe(false)
    expect(isBloodStatus('little')).toBe(true)
    expect(isBloodStatus('unknown')).toBe(false)
    expect(isMedicationStatus('taken')).toBe(true)
    expect(isMedicationStatus('unknown')).toBe(false)
    expect(isMealPhotoType('snack')).toBe(true)
    expect(isMealPhotoType('brunch')).toBe(false)
  })
})

describe('validateHealthRecordDraft', () => {
  it('有効な記録を受け付ける', () => {
    expect(() => validateHealthRecordDraft(validDraft)).not.toThrow()
  })

  it.each([-1, 6, 1.5, Number.NaN])('腹痛レベル%sを拒否する', (value) => {
    expect(() =>
      validateHealthRecordDraft({ ...validDraft, stomachPainLevel: value }),
    ).toThrow(ValidationError)
  })

  it.each([-1, 1.5, Number.NaN])('トイレ回数%sを拒否する', (value) => {
    expect(() =>
      validateHealthRecordDraft({ ...validDraft, toiletCount: value }),
    ).toThrow(ValidationError)
  })

  it('不正な日付と必須項目の欠落を拒否する', () => {
    expect(() =>
      validateHealthRecordDraft({ ...validDraft, dateKey: '2026-02-30' }),
    ).toThrow(ValidationError)

    const incomplete: Partial<HealthRecordDraft> = { ...validDraft }
    delete incomplete.condition
    expect(() => validateHealthRecordDraft(incomplete)).toThrow(ValidationError)
  })
})

describe('validateMealPhotoDraft', () => {
  it('有効な食事写真を受け付ける', () => {
    expect(() =>
      validateMealPhotoDraft({
        type: 'breakfast',
        blob: new Blob(['test'], { type: 'image/jpeg' }),
        mimeType: 'image/jpeg',
      }),
    ).not.toThrow()
  })

  it('不正な食事区分と必須項目の欠落を拒否する', () => {
    expect(() =>
      validateMealPhotoDraft({
        type: 'brunch',
        blob: new Blob(['test']),
        mimeType: '',
      }),
    ).toThrow(ValidationError)
  })
})
