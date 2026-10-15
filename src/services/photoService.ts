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

interface DecodedPhoto {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

async function decodeWithImageElement(file: File): Promise<DecodedPhoto> {
  const url = URL.createObjectURL(file)
  const image = new Image()
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('image decode failed'))
      image.src = url
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

async function decodePhoto(file: File): Promise<DecodedPhoto> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // WebKitなどcreateImageBitmapで読めない環境では画像要素へフォールバックする。
    }
  }
  return decodeWithImageElement(file)
}

export async function compressPhoto(file: File): Promise<Blob> {
  if (!SAFE_IMAGE_TYPES.includes(file.type as (typeof SAFE_IMAGE_TYPES)[number])) {
    throw new PhotoSelectionError('JPEG、PNG、WebP形式の画像を選択してください。')
  }

  let decoded: DecodedPhoto | undefined
  try {
    decoded = await decodePhoto(file)
    const size = calculatePhotoSize(decoded.width, decoded.height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas unavailable')
    // JPEG化したときに透過部分が黒くならないよう白で塗る。
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(decoded.source, 0, 0, size.width, size.height)
    return await canvasToBlob(canvas)
  } catch (error) {
    if (error instanceof PhotoSelectionError) throw error
    throw new PhotoSelectionError('写真を読み込めませんでした。別の画像をお試しください。')
  } finally {
    decoded?.close()
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
