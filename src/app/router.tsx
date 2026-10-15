import { createBrowserRouter } from 'react-router'
import { AppLayout } from '../components/layout/AppLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    hydrateFallbackElement: <p className="p-6" role="status">読み込み中…</p>,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('../pages/HomePage')).HomePage }),
      },
      {
        path: 'history',
        lazy: async () => ({ Component: (await import('../pages/HistoryPage')).HistoryPage }),
      },
      {
        path: 'history/:id',
        lazy: async () => ({ Component: (await import('../pages/RecordDetailPage')).RecordDetailPage }),
      },
      {
        path: 'graph',
        lazy: async () => ({ Component: (await import('../pages/GraphPage')).GraphPage }),
      },
      {
        path: 'settings',
        lazy: async () => ({ Component: (await import('../pages/SettingsPage')).SettingsPage }),
      },
      {
        path: 'privacy',
        lazy: async () => ({ Component: (await import('../pages/PrivacyPage')).PrivacyPage }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('../pages/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
])
