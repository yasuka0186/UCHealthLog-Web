import { Link } from 'react-router'
import { PageShell } from '../components/layout/PageShell'
import { PhasePlaceholder } from '../components/layout/PhasePlaceholder'

export function RecordDetailPage() {
  return (
    <PageShell description="選択した日の体調記録を確認します。" title="記録詳細">
      <PhasePlaceholder message="記録の詳細・編集・削除はPhase 3で実装します。" />
      <Link className="mt-6 inline-flex min-h-11 items-center font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-300" to="/history">
        履歴へ戻る
      </Link>
    </PageShell>
  )
}
