import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(__dirname, '.env.qa') })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['allure-playwright', { detail: true, resultsDir: 'allure-results', suiteTitle: true }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    viewport: { width: 1920, height: 1080 },
    baseURL: process.env.QA_BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})