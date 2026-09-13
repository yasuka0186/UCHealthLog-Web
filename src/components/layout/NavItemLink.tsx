import { NavLink } from 'react-router'
import { NavIcon } from '../icons/NavIcon'
import type { NavigationItem } from './navigation'

interface NavItemLinkProps {
  item: NavigationItem
  variant: 'bottom' | 'side'
}

export function NavItemLink({ item, variant }: NavItemLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        [
          'flex min-h-12 items-center rounded-xl font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
          variant === 'bottom'
            ? 'flex-1 flex-col justify-center gap-0.5 px-2 py-1 text-xs'
            : 'gap-3 px-4 py-3 text-sm',
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        ].join(' ')
      }
      end={item.path === '/'}
      to={item.path}
    >
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  )
}
