import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

const qaEnv = dotenv.config({ path: '.env.qa' }).parsed ?? {}

export default defineConfig({
  testDir: './',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: qaEnv.QA_UI_BASE_URL ?? 'https://jalsoochak.beehyv.com',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})