import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: '.', testMatch: 'perf.spec.ts', outputDir: './out', workers: 1, timeout: 90_000, reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5955', channel: 'msedge', locale: 'vi-VN', trace: 'off' },
  webServer: { cwd: '../..', command: 'npx vite preview --port 5955 --strictPort', url: 'http://localhost:5955', reuseExistingServer: false, timeout: 60_000, stdout: 'ignore', stderr: 'pipe' },
})
