import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

function renderLayout(path = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <h1>ホーム内容</h1> },
          { path: 'history', element: <h1>履歴内容</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  )

  render(<RouterProvider router={router} />)
}

describe('AppLayout', () => {
  it('共通レイアウトと主ナビゲーションを表示する', () => {
    renderLayout()

    expect(screen.getByRole('heading', { name: 'ホーム内容' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'メインナビゲーション' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'ホーム' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: '設定を開く' })).toHaveAttribute('href', '/settings')
  })

  it('現在のルートをナビゲーションで明示する', () => {
    renderLayout('/history')

    expect(screen.getByRole('heading', { name: '履歴内容' })).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: '履歴' })
        .some((link) => link.getAttribute('aria-current') === 'page'),
    ).toBe(true)
  })
})
