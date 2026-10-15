import { afterEach, describe, expect, it, vi } from 'vitest'
import { getStorageStatus, isQuotaExceededError, requestPersistentStorage } from './storageService'

describe('storageService', () => {
  afterEach(() => vi.restoreAllMocks())

  it('使用量・上限・永続化状態を取得し、ユーザー操作で保持を依頼する', async () => {
    const storage = { estimate: vi.fn(async () => ({ usage: 100, quota: 1000 })), persisted: vi.fn(async () => true), persist: vi.fn(async () => true) }
    Object.defineProperty(navigator, 'storage', { configurable: true, value: storage })
    await expect(getStorageStatus()).resolves.toEqual({ supported: true, usage: 100, quota: 1000, persisted: true })
    await expect(requestPersistentStorage()).resolves.toBe(true)
  })

  it('非対応環境と容量超過エラーを判定する', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined })
    await expect(getStorageStatus()).resolves.toEqual({ supported: false })
    expect(isQuotaExceededError(new DOMException('full', 'QuotaExceededError'))).toBe(true)
    expect(isQuotaExceededError(new Error('full'))).toBe(false)
  })
})
