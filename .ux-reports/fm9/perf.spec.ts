import fs from 'node:fs'
import path from 'node:path'
import { test } from '@playwright/test'
for (const mode of ['mobile', 'desktop'] as const) {
  test(`landing perf proxy ${mode}`, async ({ page, context }) => {
    if (mode === 'mobile') await page.setViewportSize({ width: 412, height: 823 })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    if (mode === 'mobile') {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 })
    }
    let bytes = 0
    cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength })
    await page.addInitScript(() => {
      (window as any).__lcp = 0; (window as any).__cls = 0; (window as any).__long = 0
      new PerformanceObserver(l => { for (const e of l.getEntries()) (window as any).__lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver(l => { for (const e of l.getEntries() as any) if (!e.hadRecentInput) (window as any).__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver(l => { for (const e of l.getEntries()) (window as any).__long += Math.max(0, e.duration - 50) }).observe({ type: 'longtask', buffered: true })
    })
    const t0 = Date.now()
    await page.goto('/', { waitUntil: 'load' })
    const load = Date.now() - t0
    await page.waitForTimeout(3000)
    const m = await page.evaluate(() => { const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { fcp: fcp?.startTime, lcp: (window as any).__lcp, cls: (window as any).__cls, tbtApprox: (window as any).__long, dcl: nav.domContentLoadedEventEnd } })
    fs.appendFileSync(path.resolve(import.meta.dirname, 'perf-log.jsonl'), JSON.stringify({ mode, load, bytes, ...m }) + '\n')
  })
}
