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
  await expect(page.getByRole('heading', { name: 'ブラウザの保存領域' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ZIPを書き出す' })).toBeVisible()

  await page.getByRole('link', { name: 'データ保存とプライバシーについて' }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.getByRole('heading', { name: 'データ保存・プライバシー' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '端末内だけに保存' })).toBeVisible()
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

test('バックアップを書き出して復元前プレビューを確認できる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.getByText('保存しました。')).toBeVisible()
  await page.getByRole('link', { name: '設定を開く' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'ZIPを書き出す' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^UCHealthLog-backup-\d{4}-\d{2}-\d{2}\.zip$/)
  const path = await download.path()
  expect(path).not.toBeNull()
  await page.getByLabel('ZIPを選択').setInputFiles(path!)
  await expect(page.getByRole('heading', { name: '復元内容の確認' })).toBeVisible()
  await expect(page.getByText('同じ日付の既存記録: 1件')).toBeVisible()
  await expect(page.getByRole('radio', { name: '既存データを保持（推奨）' })).toBeChecked()
})
