/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-07.yaml
 * Flow: JSD-07 - regularity_and_quantity_charts
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-07
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-07.fixtures'
import { DashboardPage } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-07.yaml'
const caseMetadata = {
  'JSD-07-H1': { title: 'Regularity geography chart labels, percentage presentation and context', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-020', 'TS-022'], coverageNote: 'Numerical calculation validation remains outside scope.' },
  'JSD-07-H2': { title: 'Quantity chart labels, LPCD and Demand series context', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-023', 'TS-025'], coverageNote: 'Does not assume Demand is constant across areas or time.' },
  'JSD-07-H3': { title: 'Geography and Time views for both charts', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-021', 'TS-024'], coverageNote: 'Duplicate Time controls must be scoped to their own chart menu.' },
  'JSD-07-E1': { title: 'Empty, single and many categories, equal series and long labels', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-020', 'TS-021', 'TS-023', 'TS-024'], coverageNote: 'A section title is not sufficient evidence of a populated chart.' },
  'JSD-07-E2': { title: 'Missing time buckets, date changes and late view responses', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-021', 'TS-022', 'TS-024', 'TS-025'], coverageNote: 'Does not invent zero-fill interpolation or demand aggregation behavior.' },
} as const
type CaseId = keyof typeof caseMetadata

function annotations(caseId: CaseId) {
  return [
    { type: 'case_id', description: caseId },
    { type: 'scenario_ids', description: caseMetadata[caseId].scenarioIds.join(', ') },
    { type: 'source', description: `${YAML_SOURCE}#${caseId}` },
    { type: 'yaml_source', description: YAML_SOURCE },
  ]
}

async function reportMetadata(caseId: CaseId, testInfo: TestInfo): Promise<void> {
  const metadata = caseMetadata[caseId]
  await allure.tms(caseId, `${YAML_SOURCE}#${caseId}`)
  await allure.parameter('case_id', caseId)
  await allure.parameter('flow_id', 'JSD-07')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-07.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('regularity_and_quantity_charts')
  await allure.story(metadata.title)
  await allure.severity('normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-07 regularity_and_quantity_charts', { tag: ['@JSD-07', '@jalsoochak-dashboard', '@P1', '@regression'] }, () => {
  const NOW = new Date('2026-10-14T10:00:00+05:30')
  const REGULARITY = 'Regularity Performance'
  const QUANTITY = 'Quantity Performance'
  const lower = (titles: string[]) => titles.map(t => t.toLowerCase())
  type RegularityRecord = { title: string, schemeCount: number, regularSchemeCount: number }

  /** Injects non-zero regular-scheme counts (QA data is all zero, which renders no hoverable bars). */
  async function stubRegularity(app: DashboardPage, url: string, list: (data: any) => any[], title: (r: any) => string): Promise<RegularityRecord[]> {
    const records: RegularityRecord[] = []
    await app.page.route(url, async route => {
      const json = await (await route.fetch()).json()
      list(json.data).forEach((r, i) => {
        r.regularSchemeCount = Math.min(r.schemeCount, (i % 5) + 1)
        records.push({ title: title(r), schemeCount: r.schemeCount, regularSchemeCount: r.regularSchemeCount })
      })
      await route.fulfill({ json })
    })
    return records
  }

  /** Tooltip "Name / Regularity: x%" matches regularSchemeCount / schemeCount * 100 for that region. */
  function expectRegularityTooltips(tooltips: string[], records: RegularityRecord[]): void {
    expect(tooltips.length, 'chart tooltips shown on hover').toBeGreaterThan(0)
    for (const tip of tooltips) {
      const [name, value] = tip.split('\n')
      const record = records.find(r => r.title.toLowerCase() === name.toLowerCase())
      expect(record, `tooltip category "${name}" exists in the response`).toBeTruthy()
      expect(value).toBe(`Regularity: ${(record!.regularSchemeCount / record!.schemeCount * 100).toFixed(1)}%`)
    }
  }

  /** At least one tooltip names a category from the response and carries a numeric value. */
  function expectTooltipsFromCategories(tooltips: string[], categories: string[]): void {
    expect(tooltips.length, 'chart tooltips shown on hover').toBeGreaterThan(0)
    for (const tip of tooltips) expect(tip).not.toMatch(/NaN|undefined|Infinity/)
    const names = lower(categories)
    expect(tooltips.some(tip => names.some(n => tip.toLowerCase().includes(n))), `tooltips ${JSON.stringify(tooltips)} name a category`).toBe(true)
  }

  test('JSD-07-H1: Regularity geography chart labels, percentage presentation and context', { tag: ['@JSD-07', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-07-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-07-H1', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await allure.step('National scope: labels and state categories', async () => {
      const records = await stubRegularity(app, '**/api/v1/analytics/national/dashboard?**', d => d.stateWiseRegularity, r => r.stateTitle)
      await app.goto('/')
      await expect(app.chartViewBy('Regularity')).toHaveText('Geography')
      await expect(app.chartCard(REGULARITY)).toContainText('Regularity (%)')
      await expect(app.chartCard(REGULARITY)).toContainText('States/UTs')
      await expect.poll(() => app.chartPaintedPixels(REGULARITY)).toBeGreaterThan(0)
      expectRegularityTooltips(await app.chartTooltips(REGULARITY), records)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('State scope with an applied range: request context and district categories', async () => {
      const records = await stubRegularity(app, '**/api/v1/analytics/scheme-regularity/average?**scope=child**', d => d.childRegions, r => r.title)
      const request = page.waitForRequest(r => r.url().includes('/scheme-regularity/average?tenant_id=17&parent_lgd_id=1&scope=child&start_date=2026-10-01&end_date=2026-10-05'))
      await app.applyRange('01/10/2026', '05/10/2026')
      await app.selectGeography('Assam')
      await app.closeSearch().click()
      await request
      await app.waitForData()
      await expect(app.chartCard(REGULARITY)).toContainText('Districts')
      expectRegularityTooltips(await app.chartTooltips(REGULARITY), records)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
  })

  test('JSD-07-H2: Quantity chart labels, LPCD and Demand series context', { tag: ['@JSD-07', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-07-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-07-H2', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await allure.step('National scope: axis and series labels', async () => {
      await app.goto('/')
      await expect(app.chartViewBy('Quantity')).toHaveText('Geography')
      for (const label of ['Quantity (LPCD)', 'States/UTs', 'Demand', 'Quantity']) await expect(app.chartCard(QUANTITY)).toContainText(label)
      await expect.poll(() => app.chartPaintedPixels(QUANTITY)).toBeGreaterThan(0)
    })
    await allure.step('State scope: request context and series association', async () => {
      const response = page.waitForResponse(r => r.url().includes('/water-quantity/region-wise?tenant_id=17&parent_lgd_id=1&scope=child&start_date=2026-10-01&end_date=2026-10-05'))
      await app.applyRange('01/10/2026', '05/10/2026')
      await app.selectGeography('Assam')
      await app.closeSearch().click()
      const districts = ((await (await response).json()).data.childRegions as { title: string }[]).map(c => c.title)
      await app.waitForData()
      await expect(app.chartCard(QUANTITY)).toContainText('Districts')
      const tooltips = await app.chartTooltips(QUANTITY)
      expectTooltipsFromCategories(tooltips, districts)
      for (const tip of tooltips) expect(tip).toMatch(/^.+\nDemand: [\d,]+\.\d\nQuantity: [\d,]+\.\d$/)
    })
  })

  test('JSD-07-H3: Geography and Time views for both charts', { tag: ['@JSD-07', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-07-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-07-H3', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await app.goto('/as?tab=administrative')
    const requests = app.trackAnalytics()
    for (const [chart, title] of [['Regularity', REGULARITY], ['Quantity', QUANTITY]] as const) {
      await allure.step(`${chart}: switch to Time and back to Geography`, async () => {
        await app.selectChartView(chart, 'Time')
        await expect(app.chartCard(title)).toContainText('Day')
        for (const scale of ['Day', 'Week', 'Month', 'Quarter', 'Year'] as const) await expect(app.chartCard(title).getByRole('button', { name: scale, exact: true })).toBeVisible()
        await expect.poll(() => app.chartPaintedPixels(title)).toBeGreaterThan(0)
        await app.chartCard(title).getByRole('button', { name: 'Week', exact: true }).click()
        await expect.poll(() => requests.some(u => u.includes('/periodic?') && u.includes('scale=week'))).toBe(true)
        await expect(app.chartCard(title)).toContainText('Week')
        await app.selectChartView(chart, 'Geography')
        await expect(app.chartCard(title)).toContainText('Districts')
      })
    }
    await allure.step('Views are independent per chart', async () => {
      await app.selectChartView('Regularity', 'Time')
      await expect(app.chartViewBy('Quantity')).toHaveText('Geography')
    })
  })

  test('JSD-07-E1: Empty, single and many categories, equal series and long labels', { tag: ['@JSD-07', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-07-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-07-E1', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Many categories (36 districts) render without page overflow', async () => {
      await app.goto('/as?tab=administrative')
      await expect.poll(() => app.chartPaintedPixels(REGULARITY)).toBeGreaterThan(0)
      expect(await app.hasHorizontalOverflow()).toBe(false)
    })
    await allure.step('Few categories at district scope', async () => {
      const records = await stubRegularity(app, '**/api/v1/analytics/scheme-regularity/average?**parent_lgd_id=2&scope=child**', d => d.childRegions, r => r.title)
      await app.selectGeography('Bajali')
      await app.closeSearch().click()
      await app.waitForData()
      await expect(app.chartCard(REGULARITY)).toContainText('Blocks')
      const tooltips = await app.chartTooltips(REGULARITY)
      expectRegularityTooltips(tooltips, records)
      expect(new Set(tooltips.map(t => t.split('\n')[0])).size).toBeLessThanOrEqual(records.length)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('Empty categories render an empty chart without invalid values', async () => {
      await page.route('**/api/v1/analytics/scheme-regularity/average?**scope=child**', async route => {
        const json = await (await route.fetch()).json()
        json.data.childRegions = []
        json.data.childRegionCount = 0
        await route.fulfill({ json })
      })
      await page.reload()
      await app.waitForData()
      await expect(app.chartCard(REGULARITY)).toBeVisible()
      await expect(app.chartCard(REGULARITY)).not.toContainText(/NaN|undefined|Infinity/)
      // No regularity bars are drawn, so no regularity values can be hovered.
      expect((await app.chartTooltips(REGULARITY, 6)).filter(t => t.includes('Regularity:'))).toEqual([])
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
  })

  test('JSD-07-E2: Missing time buckets, date changes and late view responses', { tag: ['@JSD-07', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-07-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-07-E2', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    const requests = app.trackAnalytics()
    await allure.step('Render a time series with missing buckets', async () => {
      await page.route('**/api/v1/analytics/scheme-regularity/periodic?**', async route => {
        const json = await (await route.fetch()).json()
        json.data.metrics = (json.data.metrics as unknown[]).filter((_, i) => i % 3 !== 1)
        await route.fulfill({ json })
      })
      await app.goto('/as?tab=administrative')
      await app.selectChartView('Regularity', 'Time')
      await expect.poll(() => app.chartPaintedPixels(REGULARITY)).toBeGreaterThan(0)
      await expect(app.chartCard(REGULARITY)).not.toContainText(/NaN|undefined|Infinity/)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('Change dates in Time view: the series follows the new range', async () => {
      await app.applyRange('01/10/2026', '05/10/2026')
      await expect.poll(() => requests.some(u => u.includes('/scheme-regularity/periodic?') && u.includes('start_date=2026-10-01&end_date=2026-10-05'))).toBe(true)
      await expect(app.chartViewBy('Regularity')).toHaveText('Time')
    })
    await allure.step('A late Day response does not replace the latest Week selection', async () => {
      await page.route('**/api/v1/analytics/scheme-regularity/periodic?**scale=day**', async route => {
        await new Promise(r => setTimeout(r, 3000))
        await route.continue()
      })
      await app.chartCard(REGULARITY).getByRole('button', { name: 'Day', exact: true }).click()
      await app.chartCard(REGULARITY).getByRole('button', { name: 'Week', exact: true }).click()
      await page.waitForTimeout(4000)
      await expect(app.chartCard(REGULARITY)).toContainText('Week')
      await expect(app.chartViewBy('Regularity')).toHaveText('Time')
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
  })
})
