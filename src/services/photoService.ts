import type { MealPhotoDraft, MealPhotoType } from '../domain/types'

export class PhotoSelectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PhotoSelectionError'
  }
}

export function fileToMealPhotoDraft(
  file: File,
  type: MealPhotoType,
): MealPhotoDraft {
  if (!file.type.startsWith('image/')) {
    throw new PhotoSelectionError('画像ファイルを選択してください。')
  }

  return {
    type,
    blob: file,
    mimeType: file.type,
  }
}

export function createPhotoObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function revokePhotoObjectUrl(url: string): void {
  URL.revokeObjectURL(url)
}
