/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-08.yaml
 * Flow: JSD-08 - reading_submission_charts
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-08
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-08.fixtures'
import { DashboardPage } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-08.yaml'
const caseMetadata = {
  'JSD-08-H1': { title: 'Submission Status segments, legend, values and help', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-026'], coverageNote: 'Verifies populated content rather than passing on a chart heading or empty placeholder.' },
  'JSD-08-H2': { title: 'Submission Rate percentages, geography, scrolling and help', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-028'], coverageNote: 'No unapproved percentage bounds are imposed.' },
  'JSD-08-H3': { title: 'Both reading charts follow dates and administrative scope', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-027', 'TS-029'], coverageNote: 'UI/API consistency is not independent validation of backend business calculations.' },
  'JSD-08-E1': { title: 'No submissions, all compliant, all anomalous and missing denominator', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-026', 'TS-028'], coverageNote: 'Status and rate are not assumed to share a denominator or sum to the same total.' },
  'JSD-08-E2': { title: 'Duplicate submissions, rounding boundaries and missing geography labels', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-026', 'TS-027', 'TS-028', 'TS-029'], coverageNote: 'No deduplication algorithm or fallback label is invented.' },
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
  await allure.parameter('flow_id', 'JSD-08')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-08.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('reading_submission_charts')
  await allure.story(metadata.title)
  await allure.severity('normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-08 reading_submission_charts', { tag: ['@JSD-08', '@jalsoochak-dashboard', '@P1', '@regression'] }, () => {
  const NOW = new Date('2026-10-14T10:00:00+05:30')
  const STATUS = 'Reading Submission Status'
  const RATE = 'Reading Submission Rate'
  const PIE_Y = [0.3, 0.5, 0.7]
  type RateRecord = { title: string, schemeCount: number, totalSubmissionDays: number }

  async function stubStatus(page: DashboardPage['page'], compliant: number, anomalous: number): Promise<void> {
    await page.route('**/api/v1/analytics/submission-status?**', route =>
      route.fulfill({ json: { success: true, data: { schemeCount: 100, compliantSubmissionCount: compliant, anomalousSubmissionCount: anomalous } } }))
  }

  /** Rewrites child-region submission days via `edit`; returns the records the chart receives. */
  async function stubRate(page: DashboardPage['page'], edit: (regions: any[]) => void): Promise<{ records: RateRecord[], days: () => number }> {
    const records: RateRecord[] = []
    let days = 1
    await page.route('**/api/v1/analytics/reading-submission-rate?**', async route => {
      const json = await (await route.fetch()).json()
      edit(json.data.childRegions)
      days = json.data.daysInRange
      records.splice(0, records.length, ...json.data.childRegions.map((c: RateRecord) => ({ title: c.title, schemeCount: c.schemeCount, totalSubmissionDays: c.totalSubmissionDays })))
      await route.fulfill({ json })
    })
    return { records, days: () => days }
  }

  const expectedRate = (r: RateRecord, days: number) => `Submission Rate: ${Math.min(100, (r.totalSubmissionDays / (r.schemeCount * days)) * 100).toFixed(1)}%`

  function expectRateTooltips(tooltips: string[], records: RateRecord[], days: number): void {
    expect(tooltips.length, 'rate tooltips shown on hover').toBeGreaterThan(0)
    for (const tip of tooltips) {
      const [name, value] = tip.split('\n')
      const matches = records.filter(r => (r.title ?? '').toLowerCase() === name.toLowerCase())
      expect(matches.length, `tooltip category "${name}" exists in the response`).toBeGreaterThan(0)
      expect(matches.map(r => expectedRate(r, days))).toContain(value)
    }
  }

  test('JSD-08-H1: Submission Status segments, legend, values and help', { tag: ['@JSD-08', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-08-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-08-H1', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Load mixed Compliant and Anomalous submissions fixture', async () => {
      await stubStatus(page, 30, 10)
      await app.goto('/as?tab=administrative')
    })
    await allure.step('Inspect segments, values and legend', async () => {
      await expect(app.chartCard(STATUS)).toContainText('Compliant Submissions')
      await expect(app.chartCard(STATUS)).toContainText('Anomalous Submissions')
      const tooltips = await app.chartTooltips(STATUS, 12, PIE_Y)
      expect([...tooltips].sort()).toEqual(['Anomalous Submissions\n10.0 (25.0%)', 'Compliant Submissions\n30.0 (75.0%)'])
    })
    await allure.step('Assert: status_help_matches_approved_definition', async () => {
      await page.getByRole('button', { name: 'Reading Submission Status info' }).hover()
      const tip = page.getByRole('tooltip').filter({ visible: true })
      await expect(tip).toContainText('Breakdown of submitted readings by compliance status across all schemes in the selected period.')
      await expect(tip).toContainText('Compliant Submissions: Readings submitted within acceptable thresholds')
      await expect(tip).toContainText('Anomalous Submissions: Readings flagged as potentially inaccurate')
    })
  })

  test('JSD-08-H2: Submission Rate percentages, geography, scrolling and help', { tag: ['@JSD-08', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-08-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-08-H2', testInfo)
    const app = new DashboardPage(page)
    const rate = await stubRate(page, regions => regions.forEach((c, i) => { c.totalSubmissionDays = i + 1 }))
    await app.goto('/as?tab=administrative')
    const seen = new Set<string>()
    await allure.step('Inspect geography and percentage records', async () => {
      await expect(app.chartCard(RATE)).toContainText('Percentage')
      await expect(app.chartCard(RATE)).toContainText('Districts')
      const tooltips = await app.chartTooltips(RATE)
      expectRateTooltips(tooltips, rate.records, rate.days())
      tooltips.forEach(t => seen.add(t.split('\n')[0]))
    })
    await allure.step('Scroll to the far end of the categories', async () => {
      await app.scrollChartToEnd(RATE)
      const tooltips = await app.chartTooltips(RATE)
      expectRateTooltips(tooltips, rate.records, rate.days())
      const atEnd = tooltips.map(t => t.split('\n')[0])
      expect(atEnd.some(name => !seen.has(name)), 'scrolling reveals further categories').toBe(true)
    })
    await allure.step('Open chart help', async () => {
      await page.getByRole('button', { name: 'Reading submission rate info' }).hover()
      await expect(page.getByRole('tooltip').filter({ visible: true })).toContainText('Reading Submission Rate of scheme = Si / N × 100')
    })
  })

  test('JSD-08-H3: Both reading charts follow dates and administrative scope', { tag: ['@JSD-08', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-08-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-08-H3', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await app.goto('/as?tab=administrative')
    await allure.step('Apply a date range at state scope', async () => {
      const status = page.waitForRequest(r => r.url().includes('/submission-status?tenant_id=17&start_date=2026-10-01&end_date=2026-10-05&lgd_id=1'))
      const rate = page.waitForRequest(r => r.url().includes('/reading-submission-rate?tenant_id=17&parent_lgd_id=1&scope=child&start_date=2026-10-01&end_date=2026-10-05'))
      await app.applyRange('01/10/2026', '05/10/2026')
      await Promise.all([status, rate])
    })
    await allure.step('Narrow to a district: both charts follow the scope', async () => {
      const status = page.waitForResponse(r => r.url().includes('/submission-status?') && r.url().includes('lgd_id=2') && r.url().includes('start_date=2026-10-01'))
      const rate = page.waitForRequest(r => r.url().includes('/reading-submission-rate?') && r.url().includes('parent_lgd_id=2') && r.url().includes('start_date=2026-10-01'))
      await app.selectGeography('Bajali')
      await app.closeSearch().click()
      const [statusResponse] = await Promise.all([status, rate])
      const counts = (await statusResponse.json()).data
      await app.waitForData()
      await expect(app.chartCard(RATE)).toContainText('Blocks')
      // The status chart shows its legend when there are submissions and an explicit empty state otherwise.
      const statusCard = page.getByText(STATUS, { exact: true }).locator('xpath=..')
      if (counts.compliantSubmissionCount + counts.anomalousSubmissionCount > 0) await expect(app.chartCard(STATUS)).toContainText('Compliant Submissions')
      else await expect(statusCard.locator('xpath=..')).toContainText('No data available')
    })
  })

  test('JSD-08-E1: No submissions, all compliant, all anomalous and missing denominator', { tag: ['@JSD-08', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-08-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-08-E1', testInfo)
    const app = new DashboardPage(page)
    for (const [fixture, compliant, anomalous, expected] of [
      ['all compliant', 50, 0, ['Compliant Submissions\n50.0 (100.0%)']],
      ['all anomalous', 0, 20, ['Anomalous Submissions\n20.0 (100.0%)']],
      ['no submissions', 0, 0, []],
    ] as const) {
      await allure.step(`Status chart: ${fixture}`, async () => {
        await page.unrouteAll({ behavior: 'ignoreErrors' })
        await stubStatus(page, compliant, anomalous)
        await app.goto('/as?tab=administrative')
        await expect(app.chartCard(STATUS)).not.toContainText(/NaN|undefined|Infinity/)
        const tooltips = (await app.chartTooltips(STATUS, 12, PIE_Y)).filter(t => /Submissions\n/.test(t))
        expect(tooltips.filter(t => !/ \(0(\.0)?%\)$/.test(t)).sort()).toEqual([...expected])
      })
    }
    await allure.step('Rate chart: missing denominator is not rendered as a number', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      const rate = await stubRate(page, regions => regions.forEach((c, i) => { c.totalSubmissionDays = i + 1; if (i === 0) c.schemeCount = 0 }))
      await app.goto('/as?tab=administrative')
      const tooltips = await app.chartTooltips(RATE)
      for (const tip of tooltips) expect(tip).not.toMatch(/NaN|Infinity|undefined/)
      expectRateTooltips(tooltips.filter(t => !t.startsWith(`${rate.records[0].title}\n`)), rate.records, rate.days())
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
  })

  test('JSD-08-E2: Duplicate submissions, rounding boundaries and missing geography labels', { tag: ['@JSD-08', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-08-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-08-E2', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Render rounding-boundary rates', async () => {
      // 1/3 -> 33.3%, 2/3 -> 66.7%, 1/8 -> 12.5%: exercises rounding at one decimal.
      const rate = await stubRate(page, regions => regions.forEach((c, i) => {
        c.schemeCount = [3, 3, 8][i % 3]
        c.totalSubmissionDays = [1, 2, 1][i % 3]
      }))
      await app.goto('/as?tab=administrative')
      const tooltips = await app.chartTooltips(RATE)
      expectRateTooltips(tooltips, rate.records, rate.days())
      expect(tooltips.map(t => t.split('\n')[1])).toEqual(expect.arrayContaining(['Submission Rate: 66.7%']))
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('Duplicate and missing region labels do not break the chart', async () => {
      await stubRate(page, regions => {
        regions.forEach((c, i) => { c.totalSubmissionDays = i + 1 })
        regions[1].title = regions[0].title
        regions[2].title = ''
      })
      await page.reload()
      await app.waitForData()
      const tooltips = await app.chartTooltips(RATE)
      expect(tooltips.length).toBeGreaterThan(0)
      for (const tip of tooltips) expect(tip).not.toMatch(/NaN|Infinity|undefined|null/)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('Apply another scope: chart context follows', async () => {
      const rate = page.waitForRequest(r => r.url().includes('/reading-submission-rate?') && r.url().includes('parent_lgd_id=2'))
      await app.selectGeography('Bajali')
      await app.closeSearch().click()
      await rate
      await app.waitForData()
      await expect(app.chartCard(RATE)).toContainText('Blocks')
    })
  })
})
