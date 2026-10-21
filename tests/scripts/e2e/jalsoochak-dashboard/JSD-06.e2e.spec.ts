/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-06.yaml
 * Flow: JSD-06 - performance_summary
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-06
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-06.fixtures'
import { DashboardPage, SUMMARY_METRIC_COLUMNS, parseNumber } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-06.yaml'
const caseMetadata = {
  'JSD-06-H1': { title: 'Summary columns, records, units and formatting', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-017'], coverageNote: 'Includes Quantity LPCD as well as MLD and avoids fixed scrape-time row values.' },
  'JSD-06-H2': { title: 'Summary context follows filters and each hierarchy level', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-018'], coverageNote: 'Tests consistency rather than claiming independent numerical correctness.' },
  'JSD-06-H3': { title: 'Every applicable column sorts records and preserves them', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-019'], coverageNote: 'Detects numeric versus lexicographic order and rows losing values during sort.' },
  'JSD-06-E1': { title: 'Ties, nulls, zeros, decimals and large grouped numbers', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-017', 'TS-019'], coverageNote: 'Unspecified tie order is not asserted as deterministic.' },
  'JSD-06-E2': { title: 'Empty and virtualized long tables retain complete records', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-017', 'TS-018', 'TS-019'], coverageNote: 'Visible DOM row count is not used as the total count of a virtualized table.' },
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
  await allure.parameter('flow_id', 'JSD-06')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-06.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('performance_summary')
  await allure.story(metadata.title)
  await allure.severity('normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-06 performance_summary', { tag: ['@JSD-06', '@jalsoochak-dashboard', '@P1', '@regression'] }, () => {
  const NOW = new Date('2026-10-14T10:00:00+05:30')
  const NATIONAL_TODAY = '/national/dashboard?start_date=2026-10-14&end_date=2026-10-14'
  const ROW_FORMAT = [/\S/, /^\d{1,3}\.\d%$/, /^[\d,]+\.\d$/, /^[\d,]+$/, /^\d{1,3}(,\d{2})*(,\d{3})?$|^\d{1,3}$/]
  const indian = (n: number) => n.toLocaleString('en-IN')
  // The UI title-cases region names that the API returns in upper case (e.g. CHARAIDEO).
  const names = (titles: string[]) => titles.map(t => t.toLowerCase()).sort()
  const byName = (records: string[][], title: string) => records.find(r => r[0].toLowerCase() === title.toLowerCase())!
  const childRegions = (lgd: number, start = '2026-10-14') => `/water-supply/average-per-region?tenant_id=17&parent_lgd_id=${lgd}&scope=child&start_date=${start}`

  function expectRowFormats(records: string[][]): void {
    for (const record of records) {
      expect(record).toHaveLength(5)
      record.forEach((cell, i) => expect(cell, `column ${i} of ${record[0]}`).toMatch(ROW_FORMAT[i]))
    }
  }

  function sortKey(column: number) {
    return (record: string[]) => column === 0 ? record[0] : parseNumber(record[column])
  }

  async function expectSortable(app: DashboardPage, header: string, column: number): Promise<void> {
    const original = await app.summaryRecords()
    const byIdentity = (rs: string[][]) => rs.map(r => r.join('|')).sort()
    for (let click = 0; click < 2; click++) {
      await app.sortButton(header).click()
      const direction = await app.columnHeader(header).getAttribute('aria-sort')
      expect(['ascending', 'descending']).toContain(direction)
      const sorted = await app.summaryRecords()
      expect(byIdentity(sorted)).toEqual(byIdentity(original))
      const keys = sorted.map(sortKey(column))
      for (let i = 1; i < keys.length; i++) {
        const cmp = typeof keys[i] === 'number' ? (keys[i] as number) - (keys[i - 1] as number) : String(keys[i]).localeCompare(String(keys[i - 1]))
        if (direction === 'ascending') expect(cmp, `${header} ascending at row ${i}`).toBeGreaterThanOrEqual(0)
        else expect(cmp, `${header} descending at row ${i}`).toBeLessThanOrEqual(0)
      }
    }
  }

  test('JSD-06-H1: Summary columns, records, units and formatting', { tag: ['@JSD-06', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-06-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-06-H1', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    const response = page.waitForResponse(r => r.url().includes(NATIONAL_TODAY))
    await app.goto('/')
    const data = (await (await response).json()).data
    await allure.step('Inspect geography and all KPI columns', async () => {
      await expect(page.getByText('Performance Summary', { exact: true })).toBeVisible()
      expect(await app.summaryHeaders()).toEqual(['State/UT', ...SUMMARY_METRIC_COLUMNS])
      expectRowFormats(await app.summaryRecords())
    })
    await allure.step('Assert: values_remain_associated_with_correct_geography', async () => {
      const records = await app.summaryRecords()
      const expected = (data.stateWiseQuantityPerformance as { stateTitle: string, totalAchievedFhtcCount: number }[])
      expect(records.map(r => r[0]).sort()).toEqual(expected.map(s => s.stateTitle).sort())
      for (const state of expected) expect(records.find(r => r[0] === state.stateTitle)![4]).toBe(indian(state.totalAchievedFhtcCount))
    })
  })

  test('JSD-06-H2: Summary context follows filters and each hierarchy level', { tag: ['@JSD-06', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-06-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-06-H2', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await app.goto('/')
    await allure.step('Apply a range at national scope', async () => {
      const response = page.waitForResponse(r => r.url().includes('/national/dashboard?start_date=2026-10-01&end_date=2026-10-05'))
      await app.applyRange('01/10/2026', '05/10/2026')
      const states = (await (await response).json()).data.stateWiseQuantityPerformance as { stateTitle: string }[]
      await expect.poll(async () => (await app.summaryRecords()).map(r => r[0]).sort()).toEqual(states.map(s => s.stateTitle).sort())
    })
    for (const [level, lgd, select, header] of [['state', 1, 'Assam', 'District'], ['district', 2, 'Bajali', 'Block']] as const) {
      await allure.step(`Inspect summary at ${level} level`, async () => {
        const response = page.waitForResponse(r => r.url().includes(childRegions(lgd, '2026-10-01')))
        await app.selectGeography(select)
        await app.closeSearch().click()
        const children = (await (await response).json()).data.childRegions as { title: string, totalAchievedFhtcCount: number }[]
        await app.waitForData()
        await expect(app.columnHeader(header)).toBeVisible()
        const records = await app.summaryRecords()
        expectRowFormats(records)
        expect(names(records.map(r => r[0]))).toEqual(names(children.map(c => c.title)))
        for (const child of children) expect(byName(records, child.title)[4]).toBe(indian(child.totalAchievedFhtcCount))
      })
    }
  })

  test('JSD-06-H3: Every applicable column sorts records and preserves them', { tag: ['@JSD-06', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-06-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-06-H3', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/as?tab=administrative')
    await expect(app.summaryRows().nth(10)).toBeVisible()
    for (const [column, header] of ['District', ...SUMMARY_METRIC_COLUMNS].entries()) {
      await allure.step(`Sort by ${header} in both directions`, async () => { await expectSortable(app, header, column) })
    }
  })

  test('JSD-06-E1: Ties, nulls, zeros, decimals and large grouped numbers', { tag: ['@JSD-06', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-06-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-06-E1', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Render boundary records through read-only interception', async () => {
      await page.route('**/api/v1/analytics/national/dashboard?**', async route => {
        const json = await (await route.fetch()).json()
        const quantity = json.data.stateWiseQuantityPerformance as Record<string, unknown>[]
        quantity.forEach((s, i) => { s.totalAchievedFhtcCount = i === 0 ? 123456789 : 0; s.totalWaterSuppliedLiters = i === 0 ? 2_500_000 : null })
        // A tie with the second state and a zero-valued record.
        quantity.push({ ...quantity[quantity.length - 1], tenantId: 9999, stateTitle: 'Tie State', stateCode: 'TS' })
        await route.fulfill({ json })
      })
      await app.goto('/')
    })
    await allure.step('Check formatting of large, zero and null values', async () => {
      const records = await app.summaryRecords()
      await expect(app.main()).not.toContainText(/NaN|undefined|Infinity/)
      expect(records.find(r => r[4] === '12,34,56,789'), 'large household grouped in Indian style').toBeTruthy()
      expect(records.filter(r => r[4] === '0').length).toBeGreaterThanOrEqual(1)
      expectRowFormats(records)
    })
    await allure.step('Sort all applicable columns with ties and zeros', async () => {
      for (const [column, header] of ['State/UT', ...SUMMARY_METRIC_COLUMNS].entries()) await expectSortable(app, header, column)
    })
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('JSD-06-E2: Empty and virtualized long tables retain complete records', { tag: ['@JSD-06', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-06-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-06-E2', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Render the empty state separately', async () => {
      await page.route('**/api/v1/analytics/national/dashboard?**', async route => {
        const json = await (await route.fetch()).json()
        json.data.stateWiseQuantityPerformance = []
        json.data.stateWiseRegularity = []
        json.data.stateWiseReadingSubmissionRate = []
        await route.fulfill({ json })
      })
      await app.goto('/')
      await expect(app.summaryRows()).toHaveCount(0)
      await expect(app.main()).not.toContainText(/NaN|undefined|Infinity/)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('Scroll all records in a populated state table', async () => {
      const response = page.waitForResponse(r => r.url().includes('/water-supply/average-per-region?tenant_id=17&parent_lgd_id=1&scope=child'))
      await app.goto('/as?tab=administrative')
      const titles = ((await (await response).json()).data.childRegions as { title: string }[]).map(c => c.title)
      await expect(app.summaryRows().nth(10)).toBeVisible()
      const rendered = (await app.summaryRecords()).map(r => r[0])
      expect(new Set(rendered).size).toBe(rendered.length)
      expect(names(rendered)).toEqual(names(titles))
      await app.summaryRows().last().scrollIntoViewIfNeeded()
      await expect(app.summaryRows().last()).toBeInViewport()
    })
    await allure.step('Sort and change scope while scrolled', async () => {
      await app.sortButton('Household').click()
      await expect(app.summaryRows()).toHaveCount((await app.summaryRecords()).length)
      expect(await app.hasHorizontalOverflow()).toBe(false)
      await app.summaryRows().filter({ hasText: /^Bajali/ }).first().click()
      await expect(page).toHaveURL(/district=2%3A2%3Abajali/)
      await app.waitForData()
      await expect(app.columnHeader('Block')).toBeVisible()
    })
  })
})
