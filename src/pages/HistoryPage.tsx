import { PageShell } from '../components/layout/PageShell'
import { PhasePlaceholder } from '../components/layout/PhasePlaceholder'

export function HistoryPage() {
  return (
    <PageShell description="これまでに保存した記録を確認します。" title="履歴">
      <PhasePlaceholder message="履歴一覧はPhase 3で実装します。" />
    </PageShell>
  )
}
