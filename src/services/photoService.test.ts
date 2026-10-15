import { describe, expect, it, vi } from 'vitest'
import {
  createPhotoObjectUrl,
  fileToMealPhotoDraft,
  PhotoSelectionError,
  revokePhotoObjectUrl,
} from './photoService'

describe('photoService', () => {
  it('画像ファイルを食事写真draftへ変換する', () => {
    const file = new File(['image'], 'meal.png', { type: 'image/png' })
    expect(fileToMealPhotoDraft(file, 'lunch')).toEqual({
      type: 'lunch',
      blob: file,
      mimeType: 'image/png',
    })
  })

  it('画像以外のファイルを拒否する', () => {
    const file = new File(['text'], 'memo.txt', { type: 'text/plain' })
    expect(() => fileToMealPhotoDraft(file, 'lunch')).toThrow(PhotoSelectionError)
  })

  it('Object URLの生成と破棄をサービス境界から呼び出す', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: () => '',
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: () => undefined,
    })
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-photo')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const blob = new Blob(['image'], { type: 'image/png' })

    expect(createPhotoObjectUrl(blob)).toBe('blob:test-photo')
    revokePhotoObjectUrl('blob:test-photo')
    expect(create).toHaveBeenCalledWith(blob)
    expect(revoke).toHaveBeenCalledWith('blob:test-photo')
  })
})
