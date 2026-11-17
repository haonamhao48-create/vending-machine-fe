import path from 'node:path'
import { expect, test } from '@playwright/test'
import { loginAs } from '../../e2e/support.ts'
test('focus ô ngày', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.goto('/admin/reports/revenue')
  await expect(page.locator('[data-total="netAmount"]')).toBeVisible()
  await page.getByRole('button', { name: 'Tháng này' }).focus()
  const from = page.getByLabel('Từ ngày')
  for (let i = 1; i <= 3; i += 1) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(300)
    const s = await page.evaluate(() => { const el = document.activeElement as HTMLElement; const c = getComputedStyle(el); return { label: el.getAttribute('aria-label') ?? el.id, fv: el.matches(':focus-visible'), shadow: c.boxShadow, border: c.borderColor } })
    console.log(i, JSON.stringify(s))
    await from.locator('xpath=ancestor::div[2]').screenshot({ path: path.resolve(import.meta.dirname, 'shots', `date-focus-${i}.png`) })
  }
})
