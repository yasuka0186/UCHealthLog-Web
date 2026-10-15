import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { UCHealthLogDatabase } from '../db/db'
import { RecordRepository } from '../db/recordRepository'
import { HistoryPage } from './HistoryPage'

describe('HistoryPage', () => {
  let database: UCHealthLogDatabase
  let repository: RecordRepository

  beforeEach(() => {
    database = new UCHealthLogDatabase(`history-page-${crypto.randomUUID()}`)
    repository = new RecordRepository(database)
  })

  afterEach(async () => {
    cleanup()
    database.close()
    await database.delete()
  })

  function renderPage() {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="/history" element={<HistoryPage repository={repository} />} />
          <Route path="/history/:id" element={<h1>詳細画面</h1>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('0件時に空状態を表示する', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: '記録はまだありません' })).toBeInTheDocument()
  })

  it('新しい日付順で表示し、カードから詳細へ遷移する', async () => {
    await repository.save({ dateKey: '2026-08-06', condition: 'normal', stomachPainLevel: 0, toiletCount: 1, bloodStatus: 'none', medicationStatus: 'notEntered', memo: '' })
    await repository.save({ dateKey: '2026-08-07', condition: 'good', stomachPainLevel: 1, toiletCount: 2, bloodStatus: 'little', medicationStatus: 'taken', memo: '' })
    renderPage()

    const links = await screen.findAllByRole('link')
    expect(links[0]).toHaveTextContent('8月7日')
    expect(links[1]).toHaveTextContent('8月6日')
    links[0]?.click()
    expect(await screen.findByRole('heading', { name: '詳細画面' })).toBeInTheDocument()
  })
})
