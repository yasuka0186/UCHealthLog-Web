import { PageShell } from '../components/layout/PageShell'
import { PhasePlaceholder } from '../components/layout/PhasePlaceholder'

export function PrivacyPage() {
  return (
    <PageShell description="記録データの保存方法と取り扱いを説明します。" title="データ保存・プライバシー">
      <PhasePlaceholder message="詳細なプライバシー案内はPhase 4で実装します。" />
    </PageShell>
  )
}
