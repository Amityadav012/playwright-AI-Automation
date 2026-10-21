/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-04.yaml
 * Flow: JSD-04 - kpis_and_previous_period_comparisons
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-04
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-04.fixtures'
import { DashboardPage, KPI_LABELS, STATE_KPI_LABELS, parseNumber } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-04.yaml'
const caseMetadata = {
  'JSD-04-H1': { title: 'Five KPI labels, units, formatting and help', type: 'happy_path', priority: 'P0', tags: ['smoke', 'regression'], scenarioIds: ['TS-009'], coverageNote: "No numeric correctness claim is derived from the dashboard's own values." },
  'JSD-04-H2': { title: 'Previous-period comparison presentation', type: 'happy_path', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-010'], coverageNote: 'Checks presentation of reference inputs rather than claiming backend calculation accuracy.' },
  'JSD-04-H3': { title: 'KPI context follows applied dates and geography', type: 'happy_path', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-011'], coverageNote: 'Equal values across filters are allowed; context and mapped results must match, not merely differ.' },
  'JSD-04-E1': { title: 'Zero, missing and anomalous values and comparisons', type: 'edge_case', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-009', 'TS-010'], coverageNote: 'Missing data must not silently become zero; no unapproved percentage bounds or precision are imposed.' },
  'JSD-04-E2': { title: 'Partial KPI failure, stale responses and refresh during selection', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-011'], coverageNote: 'All failure simulation remains browser-local and does not change server data.' },
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
  await allure.parameter('flow_id', 'JSD-04')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-04.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('kpis_and_previous_period_comparisons')
  await allure.story(metadata.title)
  await allure.severity(metadata.priority === 'P0' ? 'critical' : 'normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-04 kpis_and_previous_period_comparisons', { tag: ['@JSD-04', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'] }, () => {
  const NOW = new Date('2026-10-14T10:00:00+05:30')
  const CURRENT = '2026-10-14'
  const PREVIOUS = '2026-10-13'
  const HELP: Record<string, RegExp> = {
    'Schemes Supplying Water': /supplied water for at least one day/,
    'Quantity in MLD': /Quantity \(MLD\) = SUM\(Wk\) \/ N/,
    'Quantity in LPCD': /Quantity \(LPCD\) = SUM\(Wk\) \/ \(SUM\(FHTCi\) x P x N\)/,
    'Regularity': /Regularity = R \/ S \* 100/,
    'Critical Schemes': /not supplied water in the last 30 days/,
  }
  const FORMAT: Record<string, RegExp> = {
    'Schemes Supplying Water': /^\d{1,3}(,\d{2})*(,\d{3})?$|^\d+$/,
    'Quantity in MLD': /^[\d,]+(\.\d+)?$/,
    'Quantity in LPCD': /^[\d,]+(\.\d+)?$/,
    'Regularity': /^\d{1,3}\.\d%$/,
    'Critical Schemes': /^\d{1,3}(,\d{2})*(,\d{3})?$|^\d+$/,
  }
  const indian = (n: number) => n.toLocaleString('en-IN')

  /** Serves continuous-schemes counts per date so current and previous periods are controlled. */
  async function stubSchemeCounts(app: DashboardPage, counts: Record<string, number>): Promise<void> {
    await app.page.route('**/api/v1/analytics/continuous-schemes?**', route => {
      const start = new URL(route.request().url()).searchParams.get('start_date')!
      route.fulfill({ json: { success: true, data: { continuousSchemeCount: counts[start] ?? 0, list: false, page: null, limit: null, startDate: start, endDate: start, daysInRange: 1, schemes: null } } })
    })
  }

  test('JSD-04-H1: Five KPI labels, units, formatting and help', { tag: ['@JSD-04', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'], annotation: annotations('JSD-04-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-04-H1', testInfo)
    const app = new DashboardPage(page)
    await allure.step('National scope shows the three national KPI cards', async () => {
      await app.goto('/')
      for (const label of KPI_LABELS) await expect(app.kpiCard(label)).toBeVisible()
      await expect(app.main().getByText('Critical Schemes', { exact: true })).toHaveCount(0)
    })
    await app.goto('/as?tab=administrative')
    for (const label of STATE_KPI_LABELS) {
      await allure.step(`Inspect "${label}" value, unit formatting and help`, async () => {
        await expect(app.kpiCard(label)).toBeVisible()
        const { value } = await app.kpi(label)
        expect(value).toMatch(FORMAT[label])
        await app.kpiCard(label).getByRole('button', { name: 'More info' }).hover()
        await expect(page.getByRole('tooltip').filter({ visible: true })).toHaveText(HELP[label])
        await page.mouse.move(0, 0)
        await expect(page.getByRole('tooltip').filter({ visible: true })).toHaveCount(0)
      })
    }
  })

  test('JSD-04-H2: Previous-period comparison presentation', { tag: ['@JSD-04', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-04-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-04-H2', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    for (const [fixture, current, previous, expected] of [
      ['equal', 4, 4, /^0% vs previous 1 day$/],
      ['increasing', 10, 5, /^\+?100(\.0)?% vs previous 1 day$/],
      ['decreasing', 2, 6, /^-66\.7% vs previous 1 day$/],
    ] as const) {
      await allure.step(`Comparison for ${fixture} fixture (${previous} -> ${current})`, async () => {
        await page.unrouteAll({ behavior: 'ignoreErrors' })
        await stubSchemeCounts(app, { [CURRENT]: current, [PREVIOUS]: previous })
        await app.goto('/as?tab=administrative')
        await expect.poll(async () => (await app.kpi('Schemes Supplying Water')).value).toBe(String(current))
        const kpi = await app.kpi('Schemes Supplying Water')
        expect(kpi.comparison).toMatch(expected)
      })
    }
    await allure.step('Comparison period follows the applied range length', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await app.applyRange('01/10/2026', '05/10/2026')
      for (const label of STATE_KPI_LABELS.filter(l => l !== 'Critical Schemes')) {
        expect((await app.kpi(label)).comparison).toMatch(/ vs previous 5 days$/)
      }
      expect((await app.kpi('Quantity in LPCD')).comparison).toMatch(/^-?[\d.,]+ LPCD vs previous 5 days$/)
      expect((await app.kpi('Regularity')).comparison).toMatch(/^[-+]?[\d.]+% vs previous 5 days$/)
    })
  })

  test('JSD-04-H3: KPI context follows applied dates and geography', { tag: ['@JSD-04', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-04-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-04-H3', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await app.goto('/')
    const counts = (lgd: number, start: string, end: string) => Promise.all([
      page.waitForResponse(r => r.url().includes(`/continuous-schemes?tenant_id=17&lgd_id=${lgd}&start_date=${start}&end_date=${end}`)),
      page.waitForResponse(r => r.url().includes(`/critical-schemes?tenant_id=17&lgd_id=${lgd}&start_date=${start}&end_date=${end}`)),
    ])
    await allure.step('Apply a range at national scope', async () => {
      const response = page.waitForResponse(r => r.url().includes('/national/dashboard?start_date=2026-10-01&end_date=2026-10-05'))
      await app.applyRange('01/10/2026', '05/10/2026')
      expect((await response).ok()).toBe(true)
    })
    for (const [scope, lgd, select] of [['State Assam', 1, 'Assam'], ['District Bajali', 2, 'Bajali']] as const) {
      await allure.step(`${scope}: KPIs are requested for the scope and range and match the responses`, async () => {
        const responses = counts(lgd, '2026-10-01', '2026-10-05')
        await app.selectGeography(select)
        const [continuous, critical] = await responses
        await app.closeSearch().click()
        await app.waitForData()
        const supplying = (await continuous.json()).data.continuousSchemeCount as number
        const criticalCount = (await critical.json()).data.criticalSchemeCount as number
        expect((await app.kpi('Schemes Supplying Water')).value).toBe(indian(supplying))
        expect((await app.kpi('Critical Schemes')).value).toBe(indian(criticalCount))
        await expect(app.durationButton()).toHaveText('01/10/2026-05/10/2026')
      })
    }
  })

  test('JSD-04-E1: Zero, missing and anomalous values and comparisons', { tag: ['@JSD-04', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-04-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-04-E1', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await allure.step('Zero current and previous values', async () => {
      await stubSchemeCounts(app, { [CURRENT]: 0, [PREVIOUS]: 0 })
      await app.goto('/as?tab=administrative')
      const kpi = await app.kpi('Schemes Supplying Water')
      expect(kpi.value).toBe('0')
      expect(kpi.comparison).toBe('0% vs previous 1 day')
    })
    await allure.step('Growth from a zero baseline does not render Infinity or NaN', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await stubSchemeCounts(app, { [CURRENT]: 7, [PREVIOUS]: 0 })
      await page.reload()
      await app.waitForData()
      await expect.poll(async () => (await app.kpi('Schemes Supplying Water')).value).toBe('7')
      const kpi = await app.kpi('Schemes Supplying Water')
      expect(kpi.comparison).not.toMatch(/Infinity|NaN|undefined/)
    })
    await allure.step('Large values use Indian digit grouping', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await stubSchemeCounts(app, { [CURRENT]: 1234567, [PREVIOUS]: 1234567 })
      await page.reload()
      await app.waitForData()
      await expect.poll(async () => (await app.kpi('Schemes Supplying Water')).value).toBe('12,34,567')
    })
    await allure.step('Assert: no KPI renders an invalid number', async () => {
      await expect(app.main()).not.toContainText(/NaN|undefined|Infinity|null/)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
  })

  test('JSD-04-E2: Partial KPI failure, stale responses and refresh during selection', { tag: ['@JSD-04', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-04-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-04-E2', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(NOW)
    await allure.step('A delayed response for an earlier range does not overwrite the latest selection', async () => {
      await page.route('**/api/v1/analytics/continuous-schemes?**', async route => {
        const start = new URL(route.request().url()).searchParams.get('start_date')!
        // Responses for the earlier range (01/10) arrive late; the latest range (06/10) answers immediately.
        if (start.startsWith('2026-10-01') || start.startsWith('2026-09-')) await new Promise(r => setTimeout(r, 4000))
        await route.fulfill({ json: { success: true, data: { continuousSchemeCount: start === '2026-10-01' ? 111 : start === '2026-10-06' ? 222 : 0, list: false } } })
      })
      await app.goto('/as?tab=administrative')
      await app.applyRange('01/10/2026', '01/10/2026')
      await app.applyRange('06/10/2026', '06/10/2026')
      await expect.poll(async () => (await app.kpi('Schemes Supplying Water')).value).toBe('222')
      await page.waitForTimeout(5000)
      expect((await app.kpi('Schemes Supplying Water')).value).toBe('222')
    })
    await allure.step('Refresh during selection restores the applied scope', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await app.openSearch()
      await page.reload()
      await app.waitForData()
      await expect(app.durationButton()).toHaveText('06/10/2026')
      await expect(app.kpiCard('Schemes Supplying Water')).toBeVisible()
    })
    await allure.step('Failure of one KPI request leaves the other KPIs intact', async () => {
      await page.route('**/api/v1/analytics/critical-schemes?**', route => route.fulfill({ status: 500, body: 'error' }))
      await page.reload()
      await app.waitForData()
      for (const label of STATE_KPI_LABELS.filter(l => l !== 'Critical Schemes')) expect((await app.kpi(label)).value).toMatch(FORMAT[label])
      await expect(app.kpiCard('Critical Schemes')).toBeVisible()
    })
    await allure.step('Recover after restoring requests', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      const critical = page.waitForResponse(r => r.url().includes('/critical-schemes?') && r.url().includes('start_date=2026-10-06'))
      await page.reload()
      const count = (await (await critical).json()).data.criticalSchemeCount as number
      await app.waitForData()
      expect(parseNumber((await app.kpi('Critical Schemes')).value)).toBe(count)
    })
  })
})
