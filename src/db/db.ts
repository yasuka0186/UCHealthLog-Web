import Dexie, { type EntityTable } from 'dexie'
import type { HealthRecordRow } from '../domain/types'
import { DATABASE_SCHEMA, DATABASE_SCHEMA_V1, DATABASE_VERSION } from './schema'
import type { LegacyMealPhotoStorageRow, MealPhotoStorageRow } from './types'

export const DEFAULT_DATABASE_NAME = 'UCHealthLog'

export class UCHealthLogDatabase extends Dexie {
  healthRecords!: EntityTable<HealthRecordRow, 'id'>
  mealPhotos!: EntityTable<MealPhotoStorageRow, 'id'>

  constructor(name = DEFAULT_DATABASE_NAME) {
    super(name)

    this.version(1).stores(DATABASE_SCHEMA_V1)
    this.version(DATABASE_VERSION).stores(DATABASE_SCHEMA).upgrade(async (transaction) => {
      const table = transaction.table<LegacyMealPhotoStorageRow | MealPhotoStorageRow>('mealPhotos')
      const photos = await table.toArray()
      for (const photo of photos) {
        if ('data' in photo) continue
        const data = await Dexie.waitFor(photo.blob.arrayBuffer())
        await table.put({
          id: photo.id,
          recordId: photo.recordId,
          type: photo.type,
          data,
          mimeType: photo.mimeType,
          createdAt: photo.createdAt,
        })
      }
    })
  }
}

export const db = new UCHealthLogDatabase()

