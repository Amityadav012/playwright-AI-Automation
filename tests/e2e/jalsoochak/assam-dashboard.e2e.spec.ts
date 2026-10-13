import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 1280, height: 720 },
  reducedMotion: 'reduce',
})

test.beforeEach(async ({ page }) => {
  await page.goto('/as?tab=administrative', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Performance Summary', { exact: true })).toBeVisible({
    timeout: 60_000,
  })
})

test('TS-001 dashboard header, logo, and title @TS-001', async ({ page }) => {
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link', { name: 'JalSoochak logo with text' })).toBeVisible()
  await expect(page.getByText('National Rural Drinking Water Supply Dashboard')).toBeVisible()
})

test('TS-002 language selector exposes and allows choosing each available language @TS-002', async ({ page }) => {
  const languageButton = page.getByRole('button', { name: 'Change language' })
  await languageButton.click()

  const languageOptions = page.getByRole('menuitem')
  const optionCount = await languageOptions.count()
  expect(optionCount).toBeGreaterThan(0)

  for (let index = 0; index < optionCount; index += 1) {
    if (index > 0) await languageButton.click()
    await languageOptions.nth(index).click()
    await expect(languageButton).toBeVisible()
  }
})

test('TS-003 date filter exposes quick ranges, editable dates, Clear, and Apply @TS-003', async ({ page }) => {
  await page.getByRole('button', { name: 'Duration' }).click()

  const dateDialog = page.getByRole('dialog')
  await expect(dateDialog).toBeVisible()
  for (const range of ['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month']) {
    await expect(dateDialog.getByRole('button', { name: range, exact: true })).toBeVisible()
  }
  await expect(dateDialog.getByRole('button', { name: 'Clear', exact: true })).toBeVisible()

  const dateFields = dateDialog.getByPlaceholder('dd/mm/yyyy')
  await expect(dateFields).toHaveCount(2)

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const formatDate = (date: Date) => date.toLocaleDateString('en-GB')
  await dateFields.nth(0).fill(formatDate(yesterday))
  await dateFields.nth(1).fill(formatDate(today))
  await dateDialog.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(dateDialog).not.toBeVisible()
})

test('TS-004 administrative area search accepts a visible area query @TS-004', async ({ page }) => {
  const search = page.getByPlaceholder('Search by District')
  await expect(search).toBeVisible()
  await search.fill('Bajali')
  await expect(search).toHaveValue('Bajali')
  await search.clear()
})

test.fixme('TS-005 departmental Zone and Circle hierarchy @TS-005', async () => {})
test.fixme('TS-006 switching between Administrative and Departmental filters @TS-006', async () => {})
test.fixme('TS-007 matching and no-result search behavior @TS-007', async () => {})
test.fixme('TS-008 clearing selected filters and closing filter menus @TS-008', async () => {})

test('TS-009 top KPI labels and displayed values @TS-009', async ({ page }) => {
  for (const label of [
    'Schemes Supplying Water',
    'Quantity in MLD',
    'Quantity in LPCD',
    'Regularity',
    'Critical Schemes',
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }
})

test('TS-010 KPI cards show previous-day comparison text @TS-010', async ({ page }) => {
  await expect(page.getByText(/vs previous 1 day/).first()).toBeVisible()
})

test.fixme('TS-011 KPI values update correctly from an approved reference dataset @TS-011', async () => {})

test('TS-012 map, legend, and fullscreen control are displayed @TS-012', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Show fullscreen map' })).toBeVisible()
  for (const legendLabel of ['No Data', '>=0%', '>=30%', '>=50%', '>=70%', '>=90%']) {
    await expect(page.getByText(legendLabel, { exact: true })).toBeVisible()
  }
})

test.fixme('TS-013 map-region drill-down through the administrative hierarchy @TS-013', async () => {})

test('TS-014 map metric control switches between its two states @TS-014', async ({ page }) => {
  const metricSwitch = page.getByRole('checkbox', { name: /Switch map metric/ })
  await expect(metricSwitch).toBeVisible()
  await metricSwitch.locator('xpath=..').click()
  await expect(metricSwitch).not.toBeChecked()
  await metricSwitch.locator('xpath=..').click()
  await expect(metricSwitch).toBeChecked()
})

test.fixme('TS-015 map values recalculate from applied filters using approved reference data @TS-015', async () => {})

test.fixme('TS-016 map interaction and drill-up navigation @TS-016', async () => {})

test('TS-017 Performance Summary presents its KPI columns @TS-017', async ({ page }) => {
  const table = page.getByRole('table')
  await expect(table).toBeVisible()
  for (const column of ['Regularity (%)', 'Quantity (MLD)', 'Quantity (LPCD)', 'Household']) {
    await expect(table.getByRole('columnheader', { name: column })).toBeVisible()
  }
})

test.fixme('TS-018 Performance Summary values match applied filters at every drill-down level @TS-018', async () => {})
test.fixme('TS-019 Performance Summary sorting and complete scroll behavior @TS-019', async () => {})

test('TS-020 Regularity Performance chart section and labels @TS-020', async ({ page }) => {
  await expect(page.getByText('Regularity Performance', { exact: true })).toBeVisible()
  await expect(page.getByText('Regularity (%)', { exact: true }).first()).toBeVisible()
})

test.fixme('TS-021 Regularity chart Geography/Time views and scrolling @TS-021', async () => {})
test.fixme('TS-022 Regularity chart data against filters and drill-down oracle @TS-022', async () => {})

test('TS-023 Quantity Performance chart section and demand/quantity labels @TS-023', async ({ page }) => {
  await expect(page.getByText('Quantity Performance', { exact: true })).toBeVisible()
  await expect(page.getByText('Demand', { exact: true })).toBeVisible()
  await expect(page.getByText('Quantity', { exact: true }).first()).toBeVisible()
})

test.fixme('TS-024 Quantity chart Geography/Time views and scrolling @TS-024', async () => {})
test.fixme('TS-025 Quantity chart data against filters and drill-down oracle @TS-025', async () => {})

test('TS-026 Reading Submission Status section is present @TS-026', async ({ page }) => {
  await expect(page.getByText('Reading Submission Status', { exact: true })).toBeVisible()
})

test.fixme('TS-027 Reading Submission Status values against filters and drill-down oracle @TS-027', async () => {})

test('TS-028 Reading Submission Rate section and percentage view are present @TS-028', async ({ page }) => {
  await expect(page.getByText('Reading Submission Rate', { exact: true })).toBeVisible()
  await expect(page.getByText('Percentage', { exact: true })).toBeVisible()
})

test.fixme('TS-029 Reading Submission Rate values against filters and drill-down oracle @TS-029', async () => {})

test('TS-030 footer quick links have destinations @TS-030', async ({ page }) => {
  for (const label of [
    'Sub-Divisional Officer login',
    'Section Officer login',
    'System Users login',
    'JalSoochak website',
    'Dashboard Glossary',
  ]) {
    const link = page.getByRole('link', { name: label, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /^(https?:|mailto:|\/)/)
  }
})

test('TS-031 social and email links have destinations @TS-031', async ({ page }) => {
  await expect(page.locator('a[href^="https://x.com/"]')).toHaveCount(1)
  await expect(page.locator('a[href^="https://www.linkedin.com/"]')).toHaveCount(1)
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1)
})

test('TS-032 contact details and email link are displayed @TS-032', async ({ page }) => {
  await expect(page.locator('a[href^="mailto:"]')).toBeVisible()
  await expect(page.getByText(/\+91-80\s+4169\s+8941/)).toBeVisible()
  await expect(page.getByText(/Indiranagar, Bengaluru/)).toBeVisible()
})

test('TS-033 footer copyright and organization attribution are displayed @TS-033', async ({ page }) => {
  await expect(page.getByText(/©\s*\d{4}\s+JalSoochak/)).toBeVisible()
  await expect(page.getByText(/An initiative by Arghyam/)).toBeVisible()
})

test('TS-034 dashboard fits the agreed Chrome desktop viewport @TS-034', async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.viewportWidth).toBe(1920)
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
})

test.fixme('TS-035 performance SLA and graceful network-failure behavior @TS-035', async () => {})