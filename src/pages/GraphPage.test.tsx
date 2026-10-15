import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UCHealthLogDatabase } from '../db/db'
import { RecordRepository } from '../db/recordRepository'
import { GraphPage } from './GraphPage'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Line: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))

describe('GraphPage', () => {
  let database: UCHealthLogDatabase
  let repository: RecordRepository

  beforeEach(() => {
    database = new UCHealthLogDatabase(`graph-page-${crypto.randomUUID()}`)
    repository = new RecordRepository(database)
  })

  afterEach(async () => {
    cleanup()
    database.close()
    await database.delete()
  })

  it('0件時に空状態を表示する', async () => {
    render(<GraphPage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)
    expect(await screen.findByRole('heading', { name: '表示できる記録がありません' })).toBeInTheDocument()
  })

  it('7日・14日・30日を切り替え、未来日を除外した統計を表示する', async () => {
    for (const [dateKey, toiletCount] of [
      ['2026-07-10', 9],
      ['2026-07-25', 2],
      ['2026-08-01', 4],
      ['2026-08-07', 6],
      ['2026-08-08', 100],
    ] as const) {
      await repository.save({ dateKey, condition: 'normal', stomachPainLevel: 0, toiletCount, bloodStatus: 'none', medicationStatus: 'notEntered', memo: '' })
    }
    render(<GraphPage getToday={() => new Date(2026, 7, 7, 12)} repository={repository} />)

    expect(await screen.findByText('5.0回')).toBeInTheDocument()
    expect(screen.queryByText('100回')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '14日' }))
    expect(screen.getByRole('img', { name: '14日間のトイレ回数折れ線グラフ' })).toBeInTheDocument()
    expect(screen.getByText('4.0回')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '30日' }))
    expect(screen.getByRole('img', { name: '30日間のトイレ回数折れ線グラフ' })).toBeInTheDocument()
    expect(screen.getByText('5.3回')).toBeInTheDocument()
  })
})
