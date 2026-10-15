import { expect, test, type Page } from '@playwright/test'

function japaneseDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

async function saveRecord(page: Page, memo: string, toiletCount = 1) {
  await page.getByRole('group', { name: '体調' }).getByText('良い', { exact: true }).click()
  for (let count = 0; count < toiletCount; count += 1) {
    await page.getByRole('button', { name: 'トイレ回数を1回増やす' }).click()
  }
  await page.getByLabel('自由メモ').fill(memo)
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.getByText('保存しました。')).toBeVisible()
}

async function syntheticPng(page: Page, color: string): Promise<Buffer> {
  const bytes = await page.evaluate(async (fillColor) => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 24
    const context = canvas.getContext('2d')
    if (!context) throw new Error('テスト画像を生成できません。')
    context.fillStyle = fillColor
    context.fillRect(0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('テスト画像を生成できません。')), 'image/png')
    })
    return [...new Uint8Array(await blob.arrayBuffer())]
  }, color)
  return Buffer.from(bytes)
}

async function photoDigest(page: Page): Promise<string> {
  return page.getByAltText('朝の食事写真').evaluate(async (image) => {
    const response = await fetch((image as HTMLImageElement).src)
    const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer())
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
  })
}

test('新規保存・再読み込み・同日更新で記録が重複しない', async ({ page }) => {
  const today = new Date()
  await page.goto('/')
  await saveRecord(page, '架空の初回記録', 1)
  await page.reload()
  await expect(page.getByLabel('自由メモ')).toHaveValue('架空の初回記録')

  await page.getByLabel('自由メモ').fill('架空の更新記録')
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.getByText('保存しました。')).toBeVisible()
  await page.goto('/history')
  await expect(page.getByRole('link', { name: new RegExp(japaneseDate(today)) })).toHaveCount(1)
  await expect(page.getByText('架空の初回記録')).toHaveCount(0)
})

test('履歴から詳細を開いて編集し、確認ダイアログから削除できる', async ({ page }) => {
  const today = new Date()
  await page.goto('/')
  await saveRecord(page, '削除確認用の架空記録')
  await page.goto('/history')
  await page.getByRole('link', { name: new RegExp(japaneseDate(today)) }).click()
  await expect(page.getByRole('heading', { name: '記録詳細' })).toBeVisible()
  await page.getByLabel('自由メモ').fill('詳細画面で編集した架空記録')
  await page.getByRole('button', { name: '変更を保存する' }).click()
  await expect(page.getByText('変更を保存しました。')).toBeVisible()

  const detailUrl = page.url()
  await page.goto(detailUrl)
  await expect(page.getByLabel('自由メモ')).toHaveValue('詳細画面で編集した架空記録')
  await page.getByRole('button', { name: 'この記録を削除' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '削除する' }).click()
  await expect(page.getByText('記録はまだありません')).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('button', { name: new RegExp(`^${today.getMonth() + 1}月${today.getDate()}日$`) })).toBeVisible()
  await page.goto('/graph')
  await expect(page.getByText('表示できる記録がありません')).toBeVisible()
})

test('写真を保存・詳細表示し、同じ食事区分の写真を置換できる', async ({ page }) => {
  await page.goto('/')
  const firstPhoto = await syntheticPng(page, '#ef4444')
  await page.getByLabel('朝の写真を選択').setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: firstPhoto })
  await expect(page.getByText('写真を変更')).toBeVisible()
  await saveRecord(page, '写真確認用の架空記録')
  await page.goto('/history')
  await page.getByRole('link').filter({ hasText: japaneseDate(new Date()) }).click()
  await expect(page.getByAltText('朝の食事写真')).toBeVisible()
  const firstDigest = await photoDigest(page)

  await page.goto('/')
  const replacement = await syntheticPng(page, '#2563eb')
  await page.getByLabel('朝の写真を選択').setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: replacement })
  await expect(page.getByText('写真を変更')).toBeVisible()
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.getByText('保存しました。')).toBeVisible()
  await page.goto('/history')
  await page.getByRole('link').filter({ hasText: japaneseDate(new Date()) }).click()
  await expect.poll(() => photoDigest(page)).not.toBe(firstDigest)
  await expect(page.getByAltText('朝の食事写真')).toHaveCount(1)
})

test('グラフ期間を切り替え、未来日の記録を集計から除外する', async ({ page }) => {
  const today = new Date()
  await page.goto('/')
  await saveRecord(page, 'グラフ確認用の当日記録', 1)

  const future = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(today.getDate(), 20))
  await page.getByRole('button', { name: '翌月を表示' }).click()
  await page.getByRole('button', { name: `${future.getMonth() + 1}月${future.getDate()}日`, exact: true }).click()
  await saveRecord(page, 'グラフから除外する未来記録', 5)
  await page.goto('/graph')

  for (const period of [7, 14, 30]) {
    await page.getByRole('group').getByText(`${period}日`, { exact: true }).click()
    await expect(page.getByRole('radio', { name: `${period}日` })).toBeChecked()
    await expect(page.getByRole('img', { name: `${period}日間のトイレ回数折れ線グラフ` })).toBeVisible()
  }
  await expect(page.getByText('5回', { exact: true })).toHaveCount(0)
})

test('エクスポートを新しいブラウザ環境へインポートし、記録と写真を復元する', async ({ page, browser }) => {
  await page.goto('/')
  const photo = await syntheticPng(page, '#10b981')
  await page.getByLabel('朝の写真を選択').setInputFiles({ name: 'backup.png', mimeType: 'image/png', buffer: photo })
  await expect(page.getByText('写真を変更')).toBeVisible()
  await saveRecord(page, 'バックアップ復元用の架空記録')
  await page.goto('/settings')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'ZIPを書き出す' }).click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()

  const restoreContext = await browser.newContext()
  const restorePage = await restoreContext.newPage()
  await restorePage.goto('http://127.0.0.1:4173/settings')
  await restorePage.getByLabel('ZIPを選択').setInputFiles(downloadPath!)
  await expect(restorePage.getByText('記録 1件・写真 1枚')).toBeVisible()
  await restorePage.getByRole('button', { name: '復元を実行' }).click()
  await expect(restorePage.getByText('1件を復元しました。')).toBeVisible()
  await restorePage.goto('http://127.0.0.1:4173/history')
  await restorePage.getByRole('link').filter({ hasText: japaneseDate(new Date()) }).click()
  await expect(restorePage.getByLabel('自由メモ')).toHaveValue('バックアップ復元用の架空記録')
  await expect(restorePage.getByAltText('朝の食事写真')).toBeVisible()
  await restoreContext.close()
})

test('モバイル・タブレット・PC幅とライト・ダークモードで主要操作を表示する', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.getByRole('button', { name: '保存する' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.emulateMedia({ colorScheme: 'light' })
  const lightColor = await page.locator('main').evaluate((element) => getComputedStyle(element).color)
  await page.emulateMedia({ colorScheme: 'dark' })
  const darkColor = await page.locator('main').evaluate((element) => getComputedStyle(element).color)
  expect(darkColor).not.toBe(lightColor)
  await expect(page.getByRole('button', { name: '保存する' })).toBeVisible()
})

test('主要なdeep linkを直接開いてSPAを表示できる', async ({ page }) => {
  for (const path of ['/history', '/graph', '/settings', '/privacy', `/history/${crypto.randomUUID()}`]) {
    await page.goto(path)
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('404 Not Found')
  }
})
