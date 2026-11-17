// Extra FM9 UX checks by ux-ui-tester: 404 page, keyboard focus on R1, more states/widths of R1 and O1, print view.
import fs from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { loginAs, useThemeChoice } from '../../e2e/support.ts'

const SHOTS = path.resolve(import.meta.dirname, 'shots')
const LOG = path.resolve(import.meta.dirname, 'extra-log.jsonl')
const WIDTHS = [{ w: 1440, h: 900 }, { w: 768, h: 1024 }, { w: 390, h: 844 }]
const log = (data: Record<string, unknown>) => fs.appendFileSync(LOG, JSON.stringify(data) + '\n')

async function audit(page: Page, name: string, ready: () => Promise<void>, widths = WIDTHS) {
  for (const { w, h } of widths) {
    await page.setViewportSize({ width: w, height: h })
    await ready()
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    await page.waitForTimeout(200)
    const size = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    await page.screenshot({ path: path.join(SHOTS, `${name}-${w}.png`), fullPage: true })
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const v = axe.violations.map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, t: x.nodes.slice(0, 3).map(n => n.target.join(' ')) }))
    log({ name, w, overflow: size.sw > size.cw, sw: size.sw, cw: size.cw, axe: v })
    expect.soft(size.sw, `${name} ${w}: cuộn ngang`).toBeLessThanOrEqual(size.cw)
    expect.soft(v.filter(x => x.impact === 'critical' || x.impact === 'serious'), `${name} ${w} axe`).toEqual([])
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`404 (${theme})`, async ({ page }) => {
    await useThemeChoice(page, theme)
    await page.goto('/khong-co-trang-nay')
    await audit(page, `404-${theme}`, () => expect(page.getByRole('heading', { level: 1, name: 'Trang này không tồn tại.' })).toBeVisible())
    await expect(page).toHaveTitle(/Không tìm thấy trang/)
    const link = page.getByRole('link', { name: /Về trang giới thiệu/ })
    await page.keyboard.press('Tab')
    await expect(link).toBeFocused()
    const style = await link.evaluate(el => { const s = getComputedStyle(el); return { outline: `${s.outlineStyle} ${s.outlineWidth}`, shadow: s.boxShadow, color: s.color, bg: getComputedStyle(document.body).backgroundColor } })
    log({ name: `404-${theme}-focus`, style })
    await page.screenshot({ path: path.join(SHOTS, `404-${theme}-focus-390.png`) })
  })
}

test('R1 bàn phím: mọi điểm dừng Tab có focus thấy rõ', async ({ page }) => {
  await useThemeChoice(page, 'light')
  await loginAs(page, 'ADMIN')
  await page.goto('/admin/reports/revenue')
  await expect(page.locator('[data-total="netAmount"]')).toBeVisible()
  await page.locator('h1').click()
  const stops: Record<string, unknown>[] = []
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), inMain: !!el.closest('#admin-main'),
        outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, ring: s.boxShadow !== 'none', w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 }
    })
    if (!info) continue
    stops.push(info)
  }
  log({ name: 'r1-tab-stops', stops })
  const invisible = stops.filter(s => s.inMain && !(s.outline || s.ring))
  expect.soft(invisible, 'điểm dừng không có focus thấy rõ').toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  test(`R1 trạng thái và khổ hẹp (${theme})`, async ({ page }) => {
    await useThemeChoice(page, theme)
    await loginAs(page, 'ADMIN')
    await page.goto('/admin/reports/revenue?group=hour')
    await audit(page, `r1-hour-${theme}`, () => expect(page.locator('[data-bucket="h0"]').first()).toBeAttached())
    await page.goto('/admin/reports/revenue?from=2020-01-01&to=2020-01-07')
    await audit(page, `r1-empty-${theme}`, () => expect(page.getByText(/Không có đơn nào được thanh toán/)).toBeVisible(), [WIDTHS[2]])
    await page.goto('/admin/reports/revenue?scenario=error500:reports')
    await audit(page, `r1-500-${theme}`, () => expect(page.getByRole('alert').first()).toBeVisible(), [WIDTHS[2]])
    await page.goto('/admin/reports/revenue?scenario=403:reports')
    await audit(page, `r1-403-${theme}`, () => expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible(), [WIDTHS[2]])
    await page.goto('/admin/reports/revenue?from=2026-11-13&to=2026-11-01')
    await audit(page, `r1-range-${theme}`, () => expect(page.getByRole('alert').first()).toBeVisible(), [WIDTHS[2]])
    await page.goto('/admin/reports/revenue?scenario=missing:reports')
    await audit(page, `r1-missing-${theme}`, () => expect(page.getByText(/chưa có API báo cáo/)).toBeVisible(), [WIDTHS[2]])
    await page.goto('/admin/reports/revenue?scenario=slow:reports')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({ path: path.join(SHOTS, `r1-loading-${theme}-1440.png`) })
  })
}

test('R1 lọc 1 sản phẩm: tách tiền giảm/hoàn, tên file có SKU', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.goto('/admin/reports/revenue?from=2026-10-15&to=2026-11-13')
  await expect(page.locator('[data-total="netAmount"]')).toBeVisible()
  const products = await page.locator('[data-product]').evaluateAll(els => els.map(e => ({ id: e.getAttribute('data-product'), text: e.textContent })))
  const totals = Object.fromEntries(await Promise.all(['grossAmount', 'discountAmount', 'paidAmount', 'refundAmount', 'netAmount', 'orderCount', 'refundCount'].map(async k => [k, await page.locator(`[data-total="${k}"]`).textContent()])))
  log({ name: 'r1-30d', products, totals })
  await page.screenshot({ path: path.join(SHOTS, 'r1-30d-light-1440.png'), fullPage: true })
  for (const p of products.slice(0, 3)) {
    await page.getByLabel('Sản phẩm', { exact: true }).selectOption(p.id!)
    await expect(page.locator('[data-scope]')).toContainText('Sản phẩm ')
    await expect(page.locator('[data-total="netAmount"]')).toBeVisible()
    const t = Object.fromEntries(await Promise.all(['grossAmount', 'discountAmount', 'paidAmount', 'refundAmount', 'netAmount'].map(async k => [k, await page.locator(`[data-total="${k}"]`).textContent()])))
    const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Xuất CSV' }).click()])
    log({ name: 'r1-product', p, t, file: file.suggestedFilename(), issues: await page.getByText('Số liệu máy chủ trả về không khớp nhau').count() })
  }
})

test('R1 in / PDF: ảnh khổ in', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  await page.goto('/admin/reports/revenue')
  await expect(page.locator('[data-total="netAmount"]')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await page.setViewportSize({ width: 1000, height: 1400 })
  await page.screenshot({ path: path.join(SHOTS, 'r1-print.png'), fullPage: true })
  await page.pdf({ path: path.join(SHOTS, 'r1-print.pdf'), format: 'A4' }).catch(error => log({ name: 'pdf', error: String(error) }))
})

for (const theme of ['light', 'dark'] as const) {
  test(`O1 khối doanh thu ở 3 khổ (${theme})`, async ({ page }) => {
    await useThemeChoice(page, theme)
    await loginAs(page, 'ADMIN')
    const block = page.getByRole('region', { name: 'Doanh thu' })
    await audit(page, `o1-${theme}`, () => expect(block.locator('[data-period="week"] [data-figure="netAmount"]')).toBeVisible())
    await page.setViewportSize({ width: 390, height: 844 })
    await block.screenshot({ path: path.join(SHOTS, `o1-block-${theme}-390.png`) })
    await page.setViewportSize({ width: 1440, height: 900 })
    await block.screenshot({ path: path.join(SHOTS, `o1-block-${theme}-1440.png`) })
    await page.goto('/admin/overview?scenario=slow:reports')
    await block.screenshot({ path: path.join(SHOTS, `o1-block-loading-${theme}.png`) }).catch(() => undefined)
    await page.goto('/admin/overview?scenario=403:reports')
    await expect(block).toBeVisible()
    await page.waitForTimeout(800)
    log({ name: `o1-403-${theme}`, text: await block.textContent() })
    await block.screenshot({ path: path.join(SHOTS, `o1-block-403-${theme}.png`) })
  })
}

test('Admin shell sau khi bỏ admin.css: cỡ tiêu đề, nút, thanh bên', async ({ page }) => {
  await loginAs(page, 'ADMIN')
  const pages = ['/admin/overview', '/admin/orders', '/admin/inventory', '/admin/machines', '/admin/reports/revenue', '/admin/refunds', '/admin/tickets']
  for (const url of pages) {
    await page.goto(url)
    await expect(page.locator('#admin-main h1').first()).toBeVisible()
    await page.waitForTimeout(400)
    const info = await page.evaluate(() => {
      const h1 = document.querySelector('#admin-main h1') as HTMLElement
      const h2 = document.querySelector('#admin-main h2:not(.sr-only)') as HTMLElement | null
      const s = (el: Element | null) => el ? getComputedStyle(el).fontSize : null
      const btn = document.querySelector('#admin-main button') as HTMLElement | null
      return { h1: s(h1), h2: s(h2), btnFont: btn ? getComputedStyle(btn).fontFamily.slice(0, 30) : null, bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 30), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }
    })
    log({ name: 'shell', url, ...info })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  for (const url of pages) {
    await page.goto(url)
    await expect(page.locator('#admin-main h1').first()).toBeVisible()
    await page.waitForTimeout(400)
    const size = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
    log({ name: 'shell-390', url, ...size })
    expect.soft(size.sw, `${url} 390 cuộn ngang`).toBeLessThanOrEqual(size.cw)
  }
})
