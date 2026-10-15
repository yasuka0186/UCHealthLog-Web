import Dexie, { type EntityTable } from 'dexie'
import type { HealthRecordRow, MealPhotoRow } from '../domain/types'
import { DATABASE_SCHEMA, DATABASE_VERSION } from './schema'

export const DEFAULT_DATABASE_NAME = 'UCHealthLog'

export class UCHealthLogDatabase extends Dexie {
  healthRecords!: EntityTable<HealthRecordRow, 'id'>
  mealPhotos!: EntityTable<MealPhotoRow, 'id'>

  constructor(name = DEFAULT_DATABASE_NAME) {
    super(name)

    // Add future schema versions in ascending order and migrate existing rows
    // with Dexie's upgrade() API. Version 1 is the only real schema today.
    this.version(DATABASE_VERSION).stores(DATABASE_SCHEMA)
  }
}

export const db = new UCHealthLogDatabase()

