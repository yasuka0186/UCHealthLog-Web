// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Cloudflare security headers', () => {
  it('厳格なCSPと主要なセキュリティヘッダーを配信設定へ含める', async () => {
    const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8')
    expect(headers).toContain("default-src 'self'")
    expect(headers).toContain("connect-src 'none'")
    expect(headers).toContain("object-src 'none'")
    expect(headers).not.toContain("'unsafe-inline'")
    expect(headers).not.toContain("'unsafe-eval'")
    expect(headers).toContain('X-Content-Type-Options: nosniff')
    expect(headers).toContain('X-Frame-Options: DENY')
    expect(headers).toContain('Referrer-Policy: no-referrer')
  })
})
