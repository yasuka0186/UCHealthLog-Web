import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UCHealthLogDatabase } from '../db/db'
import { RecordRepository } from '../db/recordRepository'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  let database: UCHealthLogDatabase
  let repository: RecordRepository

  beforeEach(() => {
    database = new UCHealthLogDatabase(`home-page-${crypto.randomUUID()}`)
    repository = new RecordRepository(database)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:home-preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(async () => {
    cleanup()
    database.close()
    await database.delete()
  })

  it('初期選択日をローカルの今日にし、未登録日の初期値を表示する', async () => {
    render(<HomePage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)

    expect(await screen.findByText('2026年8月7日（金）')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '普通' })).toBeChecked()
    expect(screen.getByText('0回')).toBeInTheDocument()
    expect(screen.getByLabelText('自由メモ')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'トイレ回数を1回減らす' })).toBeDisabled()
  })

  it('月移動・日付選択・体調マーカー表示と保存済み記録の読込ができる', async () => {
    await repository.save({
      dateKey: '2026-08-06',
      condition: 'good',
      stomachPainLevel: 2,
      toiletCount: 3,
      bloodStatus: 'little',
      medicationStatus: 'taken',
      memo: '保存済みメモ',
    })
    render(<HomePage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)

    const recordedDay = await screen.findByRole('button', { name: '8月6日、体調良い' })
    fireEvent.click(recordedDay)
    await waitFor(() => expect(screen.getByLabelText('自由メモ')).toHaveValue('保存済みメモ'))
    expect(screen.getByRole('radio', { name: '良い' })).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: '翌月を表示' }))
    expect(screen.getByRole('heading', { name: '2026年9月' })).toBeInTheDocument()
  })

  it('新規保存と同日更新を行い、保存中の二重操作を防ぐ', async () => {
    const originalSave = repository.save.bind(repository)
    let releaseSave: (() => void) | undefined
    const saveSpy = vi.spyOn(repository, 'save').mockImplementation(async (...args) => {
      await new Promise<void>((resolve) => {
        releaseSave = resolve
      })
      return originalSave(...args)
    })
    render(<HomePage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)
    await screen.findByText('2026年8月7日（金）')
    fireEvent.change(screen.getByLabelText('自由メモ'), { target: { value: '更新メモ' } })

    const saveButton = screen.getByRole('button', { name: '保存する' })
    fireEvent.click(saveButton)
    expect(await screen.findByRole('button', { name: '保存中…' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '保存中…' }))
    expect(saveSpy).toHaveBeenCalledTimes(1)
    releaseSave?.()

    expect(await screen.findByText('保存しました。')).toBeInTheDocument()
    expect((await repository.listAll())).toHaveLength(1)

    fireEvent.click(screen.getByRole('radio', { name: '良い' }))
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))
    releaseSave?.()
    await waitFor(async () => expect((await repository.listAll())).toHaveLength(1))
  })

  it('写真を選択・解除し、保存した同一区分の写真を置換する', async () => {
    render(<HomePage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)
    await screen.findByText('2026年8月7日（金）')
    const input = screen.getByLabelText('朝の写真を選択')
    const first = new File(['first'], 'first.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [first] } })
    expect(await screen.findByAltText('朝の食事写真プレビュー')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '選択を解除' }))
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:home-preview'))

    const second = new File(['second'], 'second.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('朝の写真を選択'), { target: { files: [second] } })
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))
    await screen.findByText('保存しました。')
    const saved = await repository.getByDateKey('2026-08-07')
    expect(saved).toBeDefined()
    expect(await repository.getPhotos(saved!.id)).toHaveLength(1)

    const replacement = new File(['replacement'], 'replacement.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('朝の写真を選択'), { target: { files: [replacement] } })
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))
    await waitFor(async () => expect(await repository.getPhotos(saved!.id)).toHaveLength(1))
  })

  it('画像以外を拒否して画面にエラーを表示する', async () => {
    render(<HomePage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)
    await screen.findByText('2026年8月7日（金）')
    const textFile = new File(['memo'], 'memo.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('朝の写真を選択'), { target: { files: [textFile] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('画像ファイルを選択してください。')
  })
})
