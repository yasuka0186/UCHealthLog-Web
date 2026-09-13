import { PageShell } from '../components/layout/PageShell'
import { PhasePlaceholder } from '../components/layout/PhasePlaceholder'

export function GraphPage() {
  return (
    <PageShell description="トイレ回数の変化を期間ごとに振り返ります。" title="グラフ">
      <PhasePlaceholder message="グラフと統計はPhase 3で実装します。" />
    </PageShell>
  )
}
