import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router'
import { PageShell } from '../components/layout/PageShell'
import { recordRepository, type ImportMode } from '../db/recordRepository'
import { BackupService, downloadBackup, type BackupPreview } from '../services/backupService'
import { getStorageStatus, isQuotaExceededError, requestPersistentStorage, STORAGE_SHORTAGE_MESSAGE, type StorageStatus } from '../services/storageService'

function formatBytes(value?: number): string {
  if (value === undefined) return '不明'
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 ** 2).toFixed(1)} MB`
}

export function SettingsPage() {
  const backupService = useMemo(() => new BackupService(recordRepository), [])
  const [storage, setStorage] = useState<StorageStatus>()
  const [preview, setPreview] = useState<BackupPreview>()
  const [mode, setMode] = useState<ImportMode>('keep')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const refreshStorage = () => getStorageStatus().then(setStorage).catch(() => setStorage({ supported: false }))
  useEffect(() => { void refreshStorage() }, [])

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage(undefined); setError(undefined)
    try { await action() } catch (caught) {
      setError(isQuotaExceededError(caught) ? STORAGE_SHORTAGE_MESSAGE : caught instanceof Error ? caught.message : '処理を完了できませんでした。')
    } finally { setBusy(false) }
  }
  const exportData = () => run(async () => {
    const backup = await backupService.createBackup()
    downloadBackup(backup.blob, backup.fileName)
    setMessage('バックアップを書き出しました。安全な場所に保管してください。')
  })
  const selectBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void run(async () => { setPreview(await backupService.inspectBackup(file)); setMessage('内容を確認しました。まだデータは変更されていません。') })
  }
  const importData = () => {
    if (!preview) return
    void run(async () => {
      const result = await backupService.importBackup(preview, mode)
      setPreview(undefined)
      setMessage(`${result.importedRecords}件を復元しました。${result.skippedRecords > 0 ? `${result.skippedRecords}件は既存データを保持しました。` : ''}`)
      await refreshStorage()
    })
  }
  const ratio = storage?.usage !== undefined && storage.quota ? Math.round(storage.usage / storage.quota * 100) : undefined

  return (
    <PageShell description="データの保存とバックアップを管理します。" title="設定・データ管理">
      <div className="grid gap-5 lg:grid-cols-2">
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200 lg:col-span-2" role="alert">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 lg:col-span-2" role="status">{message}</p>}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">ブラウザの保存領域</h2>
          {!storage ? <p className="mt-3" role="status">確認中…</p> : storage.supported ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="font-semibold">使用量</dt><dd>{formatBytes(storage.usage)} / {formatBytes(storage.quota)}{ratio !== undefined && `（約${ratio}%）`}</dd></div>
              <div><dt className="font-semibold">保持設定</dt><dd>{storage.persisted ? '保持が許可されています' : '保持は保証されていません'}</dd></div>
            </dl>
          ) : <p className="mt-3 text-sm">このブラウザでは保存領域の詳細を取得できません。</p>}
          <button className="mt-4 min-h-11 rounded-xl bg-blue-600 px-4 font-semibold text-white disabled:opacity-60" disabled={busy || storage?.persisted} onClick={() => void run(async () => { const result = await requestPersistentStorage(); setMessage(result === true ? 'ブラウザにデータ保持を依頼しました。' : result === false ? '保持の依頼は許可されませんでした。通常どおり利用できます。' : 'このブラウザでは保持を依頼できません。'); await refreshStorage() })} type="button">データ保持をブラウザに依頼</button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">ブラウザや端末の設定によりデータが削除される場合があります。同期はされず、共用端末では同じブラウザの利用者から見える可能性があります。</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">バックアップを書き出す</h2>
          <p className="mt-2 text-sm">記録と写真をZIPファイルに保存します。健康情報と写真を含み、暗号化されません。安全な場所で保管してください。</p>
          <button className="mt-4 min-h-11 rounded-xl bg-blue-600 px-4 font-semibold text-white disabled:opacity-60" disabled={busy} onClick={() => void exportData()} type="button">ZIPを書き出す</button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="text-lg font-bold">バックアップから復元</h2>
          <p className="mt-2 text-sm">UCHealthLogが書き出したZIPを選択してください。検証が終わるまで保存データは変更しません。</p>
          <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-blue-600 px-4 font-semibold text-blue-700 dark:text-blue-300">ZIPを選択<input accept=".zip,application/zip" className="sr-only" disabled={busy} onChange={selectBackup} type="file" /></label>
          {preview && <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">
            <h3 className="font-bold">復元内容の確認</h3><p className="mt-1">記録 {preview.records.length}件・写真 {preview.photos.length}枚</p><p>期間: {preview.firstDate ?? 'なし'} 〜 {preview.lastDate ?? 'なし'}</p><p>同じ日付の既存記録: {preview.conflictCount}件</p>
            <fieldset className="mt-3"><legend className="font-semibold">同じ日付がある場合</legend><label className="mt-2 flex min-h-11 items-center gap-2"><input checked={mode === 'keep'} name="import-mode" onChange={() => setMode('keep')} type="radio" />既存データを保持（推奨）</label><label className="flex min-h-11 items-center gap-2"><input checked={mode === 'overwrite'} name="import-mode" onChange={() => setMode('overwrite')} type="radio" />バックアップで上書き</label></fieldset>
            <button className="mt-3 min-h-11 rounded-xl bg-blue-600 px-4 font-semibold text-white disabled:opacity-60" disabled={busy} onClick={importData} type="button">復元を実行</button>
          </div>}
        </section>
      </div>
      <Link className="mt-6 inline-flex min-h-11 items-center font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-300" to="/privacy">データ保存とプライバシーについて</Link>
    </PageShell>
  )
}
