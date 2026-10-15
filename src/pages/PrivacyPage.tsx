import { PageShell } from '../components/layout/PageShell'

export function PrivacyPage() {
  return (
    <PageShell description="記録データの保存方法と取り扱いを説明します。" title="データ保存・プライバシー">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">端末内だけに保存</h2><p className="mt-2 text-sm leading-6">体調記録、メモ、食事写真は、このWebサイトを開いたブラウザのIndexedDBに保存されます。サーバーへの送信、アカウント同期、クラウド同期は行いません。</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">削除と共用端末</h2><p className="mt-2 text-sm leading-6">ブラウザの閲覧データ削除、端末の容量管理、サイトのオリジン変更などによりデータを失う場合があります。同じ端末・ブラウザを共用する人から記録が見える可能性があるため、共用端末での利用には注意してください。</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">バックアップ</h2><p className="mt-2 text-sm leading-6">定期的に設定画面からバックアップしてください。ZIPには健康情報と写真が含まれ、暗号化されません。第三者がアクセスできない安全な場所に保管してください。</p></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">保存先の識別</h2><p className="mt-2 text-sm leading-6">データはこのサイトのドメイン（オリジン）ごとに分離されます。公開先のドメインが変わると以前のデータを直接読めないため、移行前にバックアップが必要です。</p></section>
      </div>
    </PageShell>
  )
}
