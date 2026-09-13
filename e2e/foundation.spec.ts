import { expect, test } from '@playwright/test'

test('主要ルートをナビゲーションで移動できる', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'ホーム' })).toBeVisible()

  await page.getByRole('navigation', { name: 'メインナビゲーション' }).last().getByRole('link', { name: '履歴' }).click()
  await expect(page).toHaveURL(/\/history$/)
  await expect(page.getByRole('heading', { name: '履歴' })).toBeVisible()

  await page.getByRole('navigation', { name: 'メインナビゲーション' }).last().getByRole('link', { name: 'グラフ' }).click()
  await expect(page).toHaveURL(/\/graph$/)
  await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible()
})

test('設定とプライバシーのルートへ移動できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('link', { name: '設定を開く' }).click()
  await expect(page.getByRole('heading', { name: '設定・データ管理' })).toBeVisible()

  await page.getByRole('link', { name: 'データ保存とプライバシーについて' }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.getByRole('heading', { name: 'データ保存・プライバシー' })).toBeVisible()
})

test('PC幅ではサイドナビゲーションを表示する', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  await expect(page.getByTestId('side-navigation')).toBeVisible()
  await expect(page.getByTestId('bottom-navigation')).toBeHidden()
})

test('OSのダークモード設定を反映する', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const lightBackground = await page.locator('html').evaluate((element) =>
    getComputedStyle(element).backgroundColor,
  )
  const lightText = await page.locator('main').evaluate((element) =>
    getComputedStyle(element).color,
  )

  await page.emulateMedia({ colorScheme: 'dark' })
  const darkBackground = await page.locator('html').evaluate((element) =>
    getComputedStyle(element).backgroundColor,
  )
  const darkText = await page.locator('main').evaluate((element) =>
    getComputedStyle(element).color,
  )

  expect(darkBackground).not.toBe(lightBackground)
  expect(darkText).not.toBe(lightText)
})
