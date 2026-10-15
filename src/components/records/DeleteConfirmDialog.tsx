import { useEffect, useRef } from 'react'

interface DeleteConfirmDialogProps {
  open: boolean
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [deleting, onCancel, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="presentation">
      <div aria-describedby="delete-dialog-description" aria-labelledby="delete-dialog-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" role="alertdialog">
        <h2 className="text-xl font-bold" id="delete-dialog-title">この記録を削除しますか？</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300" id="delete-dialog-description">
          記録と関連する食事写真を削除します。削除後は元に戻せません。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelButtonRef} className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold dark:border-slate-700" disabled={deleting} onClick={onCancel} type="button">キャンセル</button>
          <button className="min-h-11 rounded-xl bg-red-600 px-4 font-semibold text-white hover:bg-red-700 disabled:opacity-60" disabled={deleting} onClick={onConfirm} type="button">{deleting ? '削除中…' : '削除する'}</button>
        </div>
      </div>
    </div>
  )
}
