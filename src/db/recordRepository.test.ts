// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { HealthRecordDraft, MealPhotoDraft } from '../domain/types'
import { UCHealthLogDatabase } from './db'
import { RecordRepository } from './recordRepository'

const draft: HealthRecordDraft = {
  dateKey: '2026-08-07',
  condition: 'normal',
  stomachPainLevel: 1,
  toiletCount: 2,
  bloodStatus: 'none',
  medicationStatus: 'notEntered',
  memo: '合成テストデータ',
}

function photo(
  type: MealPhotoDraft['type'],
  content: string = type,
): MealPhotoDraft {
  return {
    type,
    blob: new Blob([content], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
  }
}

describe('RecordRepository', () => {
  let database: UCHealthLogDatabase
  let repository: RecordRepository
  let databaseName: string

  beforeEach(() => {
    databaseName = `UCHealthLog-test-${crypto.randomUUID()}`
    database = new UCHealthLogDatabase(databaseName)
    repository = new RecordRepository(database)
  })

  afterEach(async () => {
    database.close()
    await database.delete()
  })

  it('記録をID・dateKeyで取得し、新しい日付順に一覧化する', async () => {
    const older = await repository.save({ ...draft, dateKey: '2026-08-06' })
    const newer = await repository.save({ ...draft, dateKey: '2026-08-07' })

    await expect(repository.getById(older.id)).resolves.toEqual(older)
    await expect(repository.getByDateKey(newer.dateKey)).resolves.toEqual(newer)
    await expect(repository.listAll()).resolves.toEqual([newer, older])
  })

  it('同じdateKeyをupsertし、レコードを増やさない', async () => {
    const initial = await repository.save(draft)
    const updated = await repository.save({
      ...draft,
      condition: 'good',
      toiletCount: 4,
    })

    expect(updated.id).toBe(initial.id)
    expect(updated.createdAt).toBe(initial.createdAt)
    expect(updated.condition).toBe('good')
    expect(updated.toiletCount).toBe(4)
    expect(await database.healthRecords.count()).toBe(1)
  })

  it('DBのunique dateKey制約でも重複を拒否する', async () => {
    const saved = await repository.save(draft)

    await expect(
      database.healthRecords.add({
        ...saved,
        id: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ name: 'ConstraintError' })
  })

  it('同じrecordIdと食事区分の写真を置換し、食事順で返す', async () => {
    const saved = await repository.save(draft, {
      photos: [photo('snack'), photo('breakfast', 'before')],
    })
    const before = await repository.getPhotos(saved.id)

    await repository.save(draft, {
      photos: [photo('breakfast', 'after'), photo('dinner')],
    })
    const after = await repository.getPhotos(saved.id)

    expect(before.map(({ type }) => type)).toEqual(['breakfast', 'snack'])
    expect(after.map(({ type }) => type)).toEqual([
      'breakfast',
      'dinner',
      'snack',
    ])
    expect(after.filter(({ type }) => type === 'breakfast')).toHaveLength(1)
    expect(after.find(({ type }) => type === 'breakfast')?.id).toBe(before[0]?.id)
    expect(after[0]?.blob.size).toBe(new Blob(['after']).size)
  })

  it('DBの複合unique制約でも写真の重複を拒否する', async () => {
    const saved = await repository.save(draft, { photos: [photo('lunch')] })
    const existing = (await repository.getPhotos(saved.id))[0]
    expect(existing).toBeDefined()

    await expect(
      database.mealPhotos.add({
        ...existing!,
        id: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ name: 'ConstraintError' })
  })

  it('記録削除時に関連写真も同じtransactionで削除する', async () => {
    const saved = await repository.save(draft, {
      photos: [photo('breakfast'), photo('dinner')],
    })

    await repository.delete(saved.id)

    await expect(repository.getById(saved.id)).resolves.toBeUndefined()
    await expect(repository.getPhotos(saved.id)).resolves.toEqual([])
  })

  it('写真保存失敗時に記録本体の変更をrollbackする', async () => {
    const saved = await repository.save(draft)
    const failCreation = () => {
      throw new Error('synthetic photo failure')
    }
    database.mealPhotos.hook('creating', failCreation)

    await expect(
      repository.save(
        { ...draft, condition: 'bad' },
        { photos: [photo('breakfast')] },
      ),
    ).rejects.toThrow('synthetic photo failure')
    database.mealPhotos.hook('creating').unsubscribe(failCreation)

    const afterFailure = await repository.getById(saved.id)
    expect(afterFailure?.condition).toBe('normal')
    await expect(repository.getPhotos(saved.id)).resolves.toEqual([])
  })

  it('削除失敗時に写真削除もrollbackする', async () => {
    const saved = await repository.save(draft, {
      photos: [photo('breakfast')],
    })
    const failDeletion = () => {
      throw new Error('synthetic record deletion failure')
    }
    database.healthRecords.hook('deleting', failDeletion)

    await expect(repository.delete(saved.id)).rejects.toThrow(
      'synthetic record deletion failure',
    )
    database.healthRecords.hook('deleting').unsubscribe(failDeletion)

    await expect(repository.getById(saved.id)).resolves.toEqual(saved)
    await expect(repository.getPhotos(saved.id)).resolves.toHaveLength(1)
  })

  it('DBを閉じて再度開いた後も記録と写真を取得できる', async () => {
    const saved = await repository.save(draft, {
      photos: [photo('lunch')],
    })
    database.close()

    database = new UCHealthLogDatabase(databaseName)
    repository = new RecordRepository(database)

    await expect(repository.getById(saved.id)).resolves.toEqual(saved)
    await expect(repository.getPhotos(saved.id)).resolves.toHaveLength(1)
  })
})
