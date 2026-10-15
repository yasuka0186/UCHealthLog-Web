// @vitest-environment node

import { strToU8, zipSync } from 'fflate'
import { afterEach, describe, expect, it } from 'vitest'
import { UCHealthLogDatabase } from '../db/db'
import { RecordRepository } from '../db/recordRepository'
import type { HealthRecordDraft } from '../domain/types'
import { BackupService, BackupValidationError } from './backupService'

const draft: HealthRecordDraft = {
  dateKey: '2026-08-07', condition: 'normal', stomachPainLevel: 1,
  toiletCount: 2, bloodStatus: 'none', medicationStatus: 'taken', memo: '合成データ',
}

describe('BackupService', () => {
  const databases: UCHealthLogDatabase[] = []
  const make = () => {
    const database = new UCHealthLogDatabase(`backup-${crypto.randomUUID()}`)
    databases.push(database)
    const repository = new RecordRepository(database)
    return { database, repository, service: new BackupService(repository) }
  }
  afterEach(async () => {
    for (const database of databases.splice(0)) { database.close(); await database.delete() }
  })

  it('記録と写真をZIPへ書き出し、件数・期間・競合を事前確認できる', async () => {
    const source = make()
    await source.repository.save(draft, { photos: [{ type: 'breakfast', blob: new Blob(['photo'], { type: 'image/jpeg' }), mimeType: 'image/jpeg' }] })
    const backup = await source.service.createBackup(new Date(2026, 7, 8, 12))
    expect(backup.fileName).toBe('UCHealthLog-backup-2026-08-08.zip')

    const target = make()
    await target.repository.save({ ...draft, memo: '既存' })
    const preview = await target.service.inspectBackup(new File([backup.blob], backup.fileName, { type: 'application/zip' }))
    expect(preview.records).toHaveLength(1)
    expect(preview.photos).toHaveLength(1)
    expect(preview.firstDate).toBe('2026-08-07')
    expect(preview.conflictCount).toBe(1)
  })

  it('既存保持では写真ごとスキップし、上書きでは記録と写真を置換する', async () => {
    const source = make()
    await source.repository.save(draft, { photos: [{ type: 'lunch', blob: new Blob(['new'], { type: 'image/jpeg' }), mimeType: 'image/jpeg' }] })
    const backup = await source.service.createBackup()
    const target = make()
    const existing = await target.repository.save({ ...draft, memo: '既存' }, { photos: [{ type: 'dinner', blob: new Blob(['old'], { type: 'image/jpeg' }), mimeType: 'image/jpeg' }] })
    const preview = await target.service.inspectBackup(new File([backup.blob], 'backup.zip'))

    await expect(target.service.importBackup(preview, 'keep')).resolves.toEqual({ importedRecords: 0, skippedRecords: 1 })
    expect((await target.repository.getByDateKey(draft.dateKey))?.memo).toBe('既存')
    expect((await target.repository.getPhotos(existing.id))[0]?.type).toBe('dinner')

    await expect(target.service.importBackup(preview, 'overwrite')).resolves.toEqual({ importedRecords: 1, skippedRecords: 0 })
    const replaced = await target.repository.getByDateKey(draft.dateKey)
    expect(replaced?.memo).toBe('合成データ')
    expect((await target.repository.getPhotos(replaced!.id))[0]?.type).toBe('lunch')
  })

  it('不正なZIP・バージョン・重複・安全でないパスをDB変更前に拒否する', async () => {
    const target = make()
    await expect(target.service.inspectBackup(new File(['bad'], 'bad.zip'))).rejects.toBeInstanceOf(BackupValidationError)
    const invalid = zipSync({
      'manifest.json': strToU8(JSON.stringify({ backupFormatVersion: 99, exportedAt: new Date().toISOString(), recordCount: 0, photoCount: 0 })),
      'records.json': strToU8(JSON.stringify({ records: [], photos: [] })),
      '../escape.txt': strToU8('x'),
    })
    await expect(target.service.inspectBackup(new File([invalid], 'bad.zip'))).rejects.toBeInstanceOf(BackupValidationError)
    await expect(target.repository.listAll()).resolves.toEqual([])
  })

  it('復元中の写真保存失敗時に記録もrollbackする', async () => {
    const source = make()
    await source.repository.save(draft, { photos: [{ type: 'snack', blob: new Blob(['x'], { type: 'image/jpeg' }), mimeType: 'image/jpeg' }] })
    const backup = await source.service.createBackup()
    const target = make()
    const preview = await target.service.inspectBackup(new File([backup.blob], 'backup.zip'))
    const fail = () => { throw new Error('synthetic import failure') }
    target.database.mealPhotos.hook('creating', fail)
    await expect(target.service.importBackup(preview, 'overwrite')).rejects.toThrow('synthetic import failure')
    target.database.mealPhotos.hook('creating').unsubscribe(fail)
    await expect(target.repository.listAll()).resolves.toEqual([])
  })
})
