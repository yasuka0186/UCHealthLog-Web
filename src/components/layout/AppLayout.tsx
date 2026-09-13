import { Link, Outlet } from 'react-router'
import { NavIcon } from '../icons/NavIcon'
import { NavItemLink } from './NavItemLink'
import { primaryNavigation } from './navigation'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <a className="skip-link" href="#main-content">
        メインコンテンツへ移動
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white px-4 py-6 lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-900">
        <Link className="mb-8 flex items-center gap-3 px-3" to="/">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            UC
          </span>
          <span className="font-semibold tracking-tight">UCHealthLog</span>
        </Link>
        <nav aria-label="メインナビゲーション" className="space-y-2" data-testid="side-navigation">
          {primaryNavigation.map((item) => (
            <NavItemLink item={item} key={item.path} variant="side" />
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
          <NavItemLink
            item={{ label: '設定', path: '/settings', icon: 'settings' }}
            variant="side"
          />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link className="flex items-center gap-2 font-semibold" to="/">
              <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                UC
              </span>
              UCHealthLog
            </Link>
            <Link
              aria-label="設定を開く"
              className="grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"
              to="/settings"
            >
              <NavIcon name="settings" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-10 lg:pb-10" id="main-content">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="メインナビゲーション"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
        data-testid="bottom-navigation"
      >
        {primaryNavigation.map((item) => (
          <NavItemLink item={item} key={item.path} variant="bottom" />
        ))}
      </nav>
    </div>
  )
}
