import { describe, expect, it, vi } from 'vitest'
import {
  createPhotoObjectUrl,
  calculatePhotoSize,
  fileToMealPhotoDraft,
  PhotoSelectionError,
  revokePhotoObjectUrl,
} from './photoService'

describe('photoService', () => {
  it('画像ファイルをJPEGへ圧縮して食事写真draftへ変換する', async () => {
    const file = new File(['image'], 'meal.png', { type: 'image/png' })
    const result = await fileToMealPhotoDraft(file, 'lunch')
    expect(result.type).toBe('lunch')
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.blob.type).toBe('image/jpeg')
  })

  it('長辺を1600px以下にし、小さい画像は拡大しない', () => {
    expect(calculatePhotoSize(3200, 2400)).toEqual({ width: 1600, height: 1200 })
    expect(calculatePhotoSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('非対応形式とSVGを拒否する', async () => {
    const file = new File(['text'], 'memo.txt', { type: 'text/plain' })
    await expect(fileToMealPhotoDraft(file, 'lunch')).rejects.toThrow(PhotoSelectionError)
    await expect(fileToMealPhotoDraft(new File(['svg'], 'x.svg', { type: 'image/svg+xml' }), 'lunch')).rejects.toThrow(PhotoSelectionError)
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
