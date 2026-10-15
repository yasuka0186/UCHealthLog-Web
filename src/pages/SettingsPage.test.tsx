import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './SettingsPage'

describe('SettingsPage', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('ストレージ使用量と保持状態、バックアップ注意事項を表示する', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: {
      estimate: vi.fn(async () => ({ usage: 1024 ** 2, quota: 10 * 1024 ** 2 })),
      persisted: vi.fn(async () => false), persist: vi.fn(async () => false),
    } })
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    expect(await screen.findByText(/1.0 MB \/ 10.0 MB/)).toHaveTextContent('約10%')
    expect(screen.getByText(/暗号化されません/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'データ保持をブラウザに依頼' }))
    expect(await screen.findByText(/保持の依頼は許可されませんでした/)).toBeInTheDocument()
  })

  it('Storage API非対応でも画面を利用できる', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined })
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    expect(await screen.findByText('このブラウザでは保存領域の詳細を取得できません。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ZIPを書き出す' })).toBeEnabled()
  })
})
