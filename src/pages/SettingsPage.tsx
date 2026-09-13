import { Link } from 'react-router'
import { PageShell } from '../components/layout/PageShell'
import { PhasePlaceholder } from '../components/layout/PhasePlaceholder'

export function SettingsPage() {
  return (
    <PageShell description="データの保存とバックアップを管理します。" title="設定・データ管理">
      <PhasePlaceholder message="ストレージ管理とバックアップはPhase 4で実装します。" />
      <Link className="mt-6 inline-flex min-h-11 items-center font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-300" to="/privacy">
        データ保存とプライバシーについて
      </Link>
    </PageShell>
  )
}
