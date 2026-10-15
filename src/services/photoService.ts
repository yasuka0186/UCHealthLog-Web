import type { MealPhotoDraft, MealPhotoType } from '../domain/types'

export const PHOTO_MAX_EDGE = 1600
export const PHOTO_QUALITY = 0.8
export const SAFE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export class PhotoSelectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PhotoSelectionError'
  }
}

export function calculatePhotoSize(width: number, height: number) {
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new PhotoSelectionError('写真を圧縮できませんでした。')),
      'image/jpeg',
      PHOTO_QUALITY,
    )
  })
}

export async function compressPhoto(file: File): Promise<Blob> {
  if (!SAFE_IMAGE_TYPES.includes(file.type as (typeof SAFE_IMAGE_TYPES)[number])) {
    throw new PhotoSelectionError('JPEG、PNG、WebP形式の画像を選択してください。')
  }

  try {
    const bitmap = await createImageBitmap(file)
    const size = calculatePhotoSize(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas unavailable')
    // JPEG化したときに透過部分が黒くならないよう白で塗る。
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    bitmap.close()
    return await canvasToBlob(canvas)
  } catch (error) {
    if (error instanceof PhotoSelectionError) throw error
    throw new PhotoSelectionError('写真を読み込めませんでした。別の画像をお試しください。')
  }
}

export async function fileToMealPhotoDraft(file: File, type: MealPhotoType): Promise<MealPhotoDraft> {
  const blob = await compressPhoto(file)
  return { type, blob, mimeType: 'image/jpeg' }
}

export function createPhotoObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function revokePhotoObjectUrl(url: string): void {
  URL.revokeObjectURL(url)
}
