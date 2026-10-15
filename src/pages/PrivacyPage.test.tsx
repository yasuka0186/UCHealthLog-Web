import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrivacyPage } from './PrivacyPage'

describe('PrivacyPage', () => {
  it('ローカル保存・削除リスク・共用端末・バックアップを説明する', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/IndexedDB/)).toBeInTheDocument()
    expect(screen.getByText(/共用端末での利用/)).toBeInTheDocument()
    expect(screen.getByText(/暗号化されません/)).toBeInTheDocument()
    expect(screen.getByText(/ドメイン（オリジン）ごと/)).toBeInTheDocument()
  })
})
