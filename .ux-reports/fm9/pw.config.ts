// Extra UX checks for FM9 (ux-ui-tester, not part of the project suite). Run from apps/web:
//   PW_PORT=5955 npx playwright test -c .ux-reports/fm9/pw.config.ts
import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PW_PORT ?? 5955)
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: './out',
  workers: 2,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}`, channel: 'msedge', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce', trace: 'off', screenshot: 'only-on-failure', ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  webServer: { cwd: '../..', command: `npx vite --mode mock --port ${port} --strictPort`, url: `http://localhost:${port}`, reuseExistingServer: true, timeout: 120_000, stdout: 'ignore', stderr: 'pipe' },
})
