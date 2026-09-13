import { Link } from 'react-router'
import { PageShell } from '../components/layout/PageShell'

export function NotFoundPage() {
  return (
    <PageShell description="指定されたページは見つかりませんでした。" title="ページが見つかりません">
      <Link className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" to="/">
        ホームへ戻る
      </Link>
    </PageShell>
  )
}
