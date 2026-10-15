export interface StorageStatus {
  supported: boolean
  usage?: number
  quota?: number
  persisted?: boolean
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const storage = navigator.storage
  if (!storage) return { supported: false }
  const [estimate, persisted] = await Promise.all([
    storage.estimate?.() ?? Promise.resolve({}),
    storage.persisted?.() ?? Promise.resolve(false),
  ])
  return { supported: true, usage: estimate.usage, quota: estimate.quota, persisted }
}

export async function requestPersistentStorage(): Promise<boolean | undefined> {
  if (!navigator.storage?.persist) return undefined
  return navigator.storage.persist()
}

export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.code === DOMException.QUOTA_EXCEEDED_ERR)
}

export const STORAGE_SHORTAGE_MESSAGE =
  'ブラウザの保存容量が不足しています。写真を控える、不要なデータを整理する、バックアップ後に再試行する方法をお試しください。'
