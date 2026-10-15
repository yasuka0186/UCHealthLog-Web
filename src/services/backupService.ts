import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { ImportMode, ImportResult, RecordRepository } from '../db/recordRepository'
import type { HealthRecordRow, MealPhotoRow } from '../domain/types'
import { validateHealthRecordRow, validateMealPhotoRow, ValidationError } from '../domain/recordValidation'
import { toDateKey } from '../utils/date'

export const BACKUP_FORMAT_VERSION = 1
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

interface BackupManifest {
  backupFormatVersion: number
  exportedAt: string
  recordCount: number
  photoCount: number
}

interface PhotoMetadata extends Omit<MealPhotoRow, 'blob'> {
  fileName: string
}

interface BackupRecordsFile {
  records: HealthRecordRow[]
  photos: PhotoMetadata[]
}

export interface BackupPreview {
  manifest: BackupManifest
  records: HealthRecordRow[]
  photos: MealPhotoRow[]
  firstDate?: string
  lastDate?: string
  conflictCount: number
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupValidationError'
  }
}

function parseJson(value: Uint8Array | undefined, label: string): unknown {
  if (!value) throw new BackupValidationError(`${label}がありません。`)
  try { return JSON.parse(strFromU8(value)) as unknown } catch { throw new BackupValidationError(`${label}を読み取れません。`) }
}

function isSafePhotoPath(path: unknown): path is string {
  return typeof path === 'string' && /^photos\/[0-9a-f-]+\.(jpe?g|png|webp)$/i.test(path) && !path.includes('..')
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.slice().buffer as ArrayBuffer
}

export class BackupService {
  constructor(private readonly repository: RecordRepository) {}

  async createBackup(now = new Date()): Promise<{ blob: Blob; fileName: string }> {
    const [records, photos] = await Promise.all([this.repository.listAll(), this.repository.listAllPhotos()])
    const files: Record<string, Uint8Array> = {}
    const metadata: PhotoMetadata[] = []
    for (const photo of photos) {
      const fileName = `photos/${photo.id}.${extensionFor(photo.mimeType)}`
      files[fileName] = new Uint8Array(await photo.blob.arrayBuffer())
      metadata.push({
        id: photo.id,
        recordId: photo.recordId,
        type: photo.type,
        mimeType: photo.mimeType,
        createdAt: photo.createdAt,
        fileName,
      })
    }
    const manifest: BackupManifest = {
      backupFormatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: now.toISOString(),
      recordCount: records.length,
      photoCount: photos.length,
    }
    files['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))
    files['records.json'] = strToU8(JSON.stringify({ records, photos: metadata }, null, 2))
    return {
      blob: new Blob([zipSync(files)], { type: 'application/zip' }),
      fileName: `UCHealthLog-backup-${toDateKey(now)}.zip`,
    }
  }

  async inspectBackup(file: File): Promise<BackupPreview> {
    let files: Record<string, Uint8Array>
    try { files = unzipSync(new Uint8Array(await file.arrayBuffer())) } catch { throw new BackupValidationError('有効なZIPバックアップを選択してください。') }
    if (Object.keys(files).some((path) => path !== 'manifest.json' && path !== 'records.json' && !isSafePhotoPath(path))) {
      throw new BackupValidationError('バックアップに安全でないファイル名が含まれています。')
    }
    const manifestValue = parseJson(files['manifest.json'], 'manifest.json')
    const recordsValue = parseJson(files['records.json'], 'records.json')
    if (!manifestValue || typeof manifestValue !== 'object') throw new BackupValidationError('manifest.jsonが不正です。')
    const manifest = manifestValue as BackupManifest
    if (manifest.backupFormatVersion !== BACKUP_FORMAT_VERSION) throw new BackupValidationError('対応していないバックアップ形式です。')
    if (typeof manifest.exportedAt !== 'string' || Number.isNaN(Date.parse(manifest.exportedAt)) || !Number.isInteger(manifest.recordCount) || !Number.isInteger(manifest.photoCount)) {
      throw new BackupValidationError('manifest.jsonが不正です。')
    }
    if (!recordsValue || typeof recordsValue !== 'object') throw new BackupValidationError('records.jsonが不正です。')
    const payload = recordsValue as BackupRecordsFile
    if (!Array.isArray(payload.records) || !Array.isArray(payload.photos)) throw new BackupValidationError('バックアップのデータ構造が不正です。')
    try {
      payload.records.forEach(validateHealthRecordRow)
    } catch (error) {
      throw new BackupValidationError(error instanceof ValidationError ? error.message : '記録データが不正です。')
    }
    const ids = new Set<string>()
    const dates = new Set<string>()
    for (const record of payload.records) {
      if (ids.has(record.id) || dates.has(record.dateKey)) throw new BackupValidationError('記録IDまたは日付が重複しています。')
      ids.add(record.id); dates.add(record.dateKey)
    }
    const photoKeys = new Set<string>()
    const photoIds = new Set<string>()
    const referencedFiles = new Set<string>()
    const photos: MealPhotoRow[] = payload.photos.map((metadata) => {
      if (!metadata || typeof metadata !== 'object') throw new BackupValidationError('写真情報が不正です。')
      if (!ids.has(metadata.recordId)) throw new BackupValidationError('関連する記録がない写真があります。')
      if (!ALLOWED_MIME_TYPES.includes(metadata.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) throw new BackupValidationError('写真のMIME typeが不正です。')
      if (!isSafePhotoPath(metadata.fileName) || !files[metadata.fileName]) throw new BackupValidationError('写真ファイルが不足または不正です。')
      if (metadata.fileName !== `photos/${metadata.id}.${extensionFor(metadata.mimeType)}`) throw new BackupValidationError('写真ファイル名と写真情報が一致しません。')
      const key = `${metadata.recordId}:${metadata.type}`
      if (photoKeys.has(key)) throw new BackupValidationError('同じ食事区分の写真が重複しています。')
      if (photoIds.has(metadata.id)) throw new BackupValidationError('写真IDが重複しています。')
      photoKeys.add(key)
      photoIds.add(metadata.id)
      referencedFiles.add(metadata.fileName)
      const row: MealPhotoRow = { ...metadata, blob: new Blob([toArrayBuffer(files[metadata.fileName])], { type: metadata.mimeType }) }
      delete (row as MealPhotoRow & { fileName?: string }).fileName
      try { validateMealPhotoRow(row) } catch (error) { throw new BackupValidationError(error instanceof ValidationError ? error.message : '写真情報が不正です。') }
      return row
    })
    const archivedPhotos = Object.keys(files).filter((path) => path.startsWith('photos/'))
    if (archivedPhotos.some((path) => !referencedFiles.has(path))) throw new BackupValidationError('参照されていない写真ファイルがあります。')
    if (manifest.recordCount !== payload.records.length || manifest.photoCount !== photos.length) throw new BackupValidationError('件数情報が一致しません。')
    const existingRecords = await this.repository.listAll()
    const existingDates = new Set(existingRecords.map((record) => record.dateKey))
    const existingById = new Map(existingRecords.map((record) => [record.id, record]))
    if (payload.records.some((record) => existingById.has(record.id) && existingById.get(record.id)?.dateKey !== record.dateKey)) {
      throw new BackupValidationError('既存の別日記録と同じIDが含まれています。')
    }
    const sortedDates = [...dates].sort()
    return { manifest, records: payload.records, photos, firstDate: sortedDates[0], lastDate: sortedDates.at(-1), conflictCount: payload.records.filter((record) => existingDates.has(record.dateKey)).length }
  }

  importBackup(preview: BackupPreview, mode: ImportMode): Promise<ImportResult> {
    return this.repository.importRows(preview.records, preview.photos, mode)
  }
}

export function downloadBackup(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = fileName; link.click()
  URL.revokeObjectURL(url)
}
