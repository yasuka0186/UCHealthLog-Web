import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { UCHealthLogDatabase } from '../db/db'
import { RecordRepository } from '../db/recordRepository'
import { RecordDetailPage } from './RecordDetailPage'

describe('RecordDetailPage', () => {
  let database: UCHealthLogDatabase
  let repository: RecordRepository

  beforeEach(() => {
    database = new UCHealthLogDatabase(`detail-page-${crypto.randomUUID()}`)
    repository = new RecordRepository(database)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:detail-photo'),
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

  function renderPage(id: string) {
    render(
      <MemoryRouter initialEntries={[`/history/${id}`]}>
        <Routes>
          <Route path="/history/:id" element={<RecordDetailPage repository={repository} />} />
          <Route path="/history" element={<h1>履歴一覧</h1>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('存在しないIDをNot Found表示にする', async () => {
    renderPage(crypto.randomUUID())
    expect(await screen.findByRole('heading', { name: '記録が見つかりません' })).toBeInTheDocument()
  })

  it('draftは保存操作まで永続化せず、保存後に反映する', async () => {
    const saved = await repository.save({ dateKey: '2026-08-07', condition: 'normal', stomachPainLevel: 0, toiletCount: 1, bloodStatus: 'none', medicationStatus: 'notEntered', memo: '' })
    renderPage(saved.id)
    await screen.findByText('2026年8月7日（金）')

    fireEvent.click(screen.getByRole('radio', { name: '悪い' }))
    expect((await repository.getById(saved.id))?.condition).toBe('normal')
    fireEvent.click(screen.getByRole('button', { name: '変更を保存する' }))
    expect(await screen.findByText('変更を保存しました。')).toBeInTheDocument()
    expect((await repository.getById(saved.id))?.condition).toBe('bad')
  })

  it('HTML文字列をメモとして扱い、コードとして解釈しない', async () => {
    const html = '<img src=x onerror=alert(1)>'
    const saved = await repository.save({ dateKey: '2026-08-07', condition: 'normal', stomachPainLevel: 0, toiletCount: 1, bloodStatus: 'none', medicationStatus: 'notEntered', memo: html })
    renderPage(saved.id)

    expect(await screen.findByLabelText('自由メモ')).toHaveValue(html)
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })

  it('食事写真を順番に表示し、Object URLを破棄する', async () => {
    const saved = await repository.save(
      { dateKey: '2026-08-07', condition: 'normal', stomachPainLevel: 0, toiletCount: 1, bloodStatus: 'none', medicationStatus: 'notEntered', memo: '' },
      { photos: [
        { type: 'snack', blob: new Blob(['snack'], { type: 'image/png' }), mimeType: 'image/png' },
        { type: 'breakfast', blob: new Blob(['breakfast'], { type: 'image/png' }), mimeType: 'image/png' },
      ] },
    )
    renderPage(saved.id)
    const images = await screen.findAllByRole('img')
    expect(images.map((image) => image.getAttribute('alt'))).toEqual(['朝の食事写真', '間食の食事写真'])
    cleanup()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:detail-photo')
  })

  it('削除確認後に記録と関連写真を削除して履歴へ戻る', async () => {
    const saved = await repository.save(
      { dateKey: '2026-08-07', condition: 'normal', stomachPainLevel: 0, toiletCount: 1, bloodStatus: 'none', medicationStatus: 'notEntered', memo: '' },
      { photos: [{ type: 'breakfast', blob: new Blob(['photo'], { type: 'image/png' }), mimeType: 'image/png' }] },
    )
    renderPage(saved.id)
    fireEvent.click(await screen.findByRole('button', { name: 'この記録を削除' }))
    const cancel = screen.getByRole('button', { name: 'キャンセル' })
    expect(cancel).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    expect(await screen.findByRole('heading', { name: '履歴一覧' })).toBeInTheDocument()
    await waitFor(async () => expect(await repository.getById(saved.id)).toBeUndefined())
    expect(await repository.getPhotos(saved.id)).toEqual([])
  })
})
