import path from 'node:path'
import { expect, test } from '@playwright/test'
test('ảnh hợp tác', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const img = page.locator('#hop-tac img').first()
  await img.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  console.log(JSON.stringify(await page.locator('#hop-tac img').evaluateAll(els => els.map(e => { const i = e as HTMLImageElement; const r = i.getBoundingClientRect(); return { src: i.currentSrc.slice(-40), complete: i.complete, nw: i.naturalWidth, w: r.width, h: r.height, op: getComputedStyle(i).opacity, alt: i.alt } }))))
  await page.locator('#hop-tac').screenshot({ path: path.resolve(import.meta.dirname, 'shots', 'landing-hop-tac-1440.png') })
})
