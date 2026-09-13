import type { IconName } from '../icons/NavIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: IconName
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'ホーム', path: '/', icon: 'home' },
  { label: '履歴', path: '/history', icon: 'history' },
  { label: 'グラフ', path: '/graph', icon: 'graph' },
]
