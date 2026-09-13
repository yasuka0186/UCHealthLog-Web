import { PageShell } from '../components/layout/PageShell'
import { PhasePlaceholder } from '../components/layout/PhasePlaceholder'

export function HomePage() {
  return (
    <PageShell
      description="日々の体調を記録し、カレンダーから振り返ります。"
      title="ホーム"
    >
      <PhasePlaceholder message="記録フォームとカレンダーはPhase 3で実装します。" />
    </PageShell>
  )
}
