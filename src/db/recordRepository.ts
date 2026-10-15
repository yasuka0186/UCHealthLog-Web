import {
  MEAL_PHOTO_TYPES,
  type HealthRecordDraft,
  type HealthRecordRow,
  type MealPhotoDraft,
  type MealPhotoRow,
} from '../domain/types'
import {
  validateHealthRecordDraft,
  validateMealPhotoDraft,
} from '../domain/recordValidation'
import { db, type UCHealthLogDatabase } from './db'

export interface SaveRecordOptions {
  photos?: readonly MealPhotoDraft[]
}

function createId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

export class RecordRepository {
  constructor(private readonly database: UCHealthLogDatabase = db) {}

  async getByDateKey(dateKey: string): Promise<HealthRecordRow | undefined> {
    return this.database.healthRecords.where('dateKey').equals(dateKey).first()
  }

  async getById(id: string): Promise<HealthRecordRow | undefined> {
    return this.database.healthRecords.get(id)
  }

  async listAll(): Promise<HealthRecordRow[]> {
    return this.database.healthRecords.orderBy('dateKey').reverse().toArray()
  }

  async getPhotos(recordId: string): Promise<MealPhotoRow[]> {
    const photos = await this.database.mealPhotos
      .where('recordId')
      .equals(recordId)
      .toArray()
    return photos.sort(
      (left, right) =>
        MEAL_PHOTO_TYPES.indexOf(left.type) -
        MEAL_PHOTO_TYPES.indexOf(right.type),
    )
  }

  async save(
    draft: HealthRecordDraft,
    options: SaveRecordOptions = {},
  ): Promise<HealthRecordRow> {
    validateHealthRecordDraft(draft)
    const photos = options.photos ?? []
    for (const photo of photos) validateMealPhotoDraft(photo)

    let savedRecord: HealthRecordRow | undefined

    await this.database.transaction(
      'rw',
      this.database.healthRecords,
      this.database.mealPhotos,
      async () => {
        const existing = await this.getByDateKey(draft.dateKey)
        const timestamp = nowIso()
        const record: HealthRecordRow = existing
          ? {
              ...existing,
              ...draft,
              id: existing.id,
              createdAt: existing.createdAt,
              updatedAt: timestamp,
            }
          : {
              ...draft,
              id: createId(),
              createdAt: timestamp,
              updatedAt: timestamp,
            }

        await this.database.healthRecords.put(record)

        for (const photo of photos) {
          const previous = await this.database.mealPhotos
            .where('[recordId+type]')
            .equals([record.id, photo.type])
            .first()
          const row: MealPhotoRow = {
            id: previous?.id ?? createId(),
            recordId: record.id,
            type: photo.type,
            blob: photo.blob,
            mimeType: photo.mimeType,
            createdAt: timestamp,
          }
          await this.database.mealPhotos.put(row)
        }

        savedRecord = record
      },
    )

    if (!savedRecord) {
      throw new Error('記録を保存できませんでした。')
    }
    return savedRecord
  }

  async delete(id: string): Promise<void> {
    await this.database.transaction(
      'rw',
      this.database.healthRecords,
      this.database.mealPhotos,
      async () => {
        await this.database.mealPhotos.where('recordId').equals(id).delete()
        await this.database.healthRecords.delete(id)
      },
    )
  }

}

export const recordRepository = new RecordRepository()
