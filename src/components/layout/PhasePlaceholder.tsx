interface PhasePlaceholderProps {
  message: string
}

export function PhasePlaceholder({ message }: PhasePlaceholderProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="font-medium text-slate-800 dark:text-slate-100">{message}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        現在は基盤のみを準備しています。記録データはまだ保存されません。
      </p>
    </div>
  )
}
