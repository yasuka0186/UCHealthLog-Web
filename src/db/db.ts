import Dexie, { type EntityTable } from 'dexie'
import type { HealthRecordRow, MealPhotoRow } from '../domain/types'
import { DATABASE_SCHEMA, DATABASE_VERSION } from './schema'

export const DEFAULT_DATABASE_NAME = 'UCHealthLog'

export class UCHealthLogDatabase extends Dexie {
  healthRecords!: EntityTable<HealthRecordRow, 'id'>
  mealPhotos!: EntityTable<MealPhotoRow, 'id'>

  constructor(name = DEFAULT_DATABASE_NAME) {
    super(name)

    // 将来はバージョンを昇順に追加し、Dexieのupgrade()で既存データを移行する。
    // 現時点で実在するスキーマはバージョン1だけである。
    this.version(DATABASE_VERSION).stores(DATABASE_SCHEMA)
  }
}

export const db = new UCHealthLogDatabase()

