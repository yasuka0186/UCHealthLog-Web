// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Cloudflare Workers Static Assets設定', () => {
  it('distだけを配信し、SPA fallbackを有効にする', async () => {
    const raw = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
    const config = JSON.parse(raw) as {
      assets?: { directory?: string; not_found_handling?: string }
    }
    expect(config.assets).toEqual({
      directory: './dist',
      not_found_handling: 'single-page-application',
    })
  })
})
