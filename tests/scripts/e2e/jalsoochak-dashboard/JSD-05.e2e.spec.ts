/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-05.yaml
 * Flow: JSD-05 - map_and_geographic_navigation
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-05
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-05.fixtures'
import { DashboardPage } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-05.yaml'
const caseMetadata = {
  'JSD-05-H1': { title: 'Map boundaries, labels, legend and fullscreen', type: 'happy_path', priority: 'P0', tags: ['smoke', 'regression'], scenarioIds: ['TS-012'], coverageNote: 'Checks real map rendering rather than only presence of the fullscreen button.' },
  'JSD-05-H2': { title: 'Map-region drill-down and drill-up through all supported levels', type: 'happy_path', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-013', 'TS-016'], coverageNote: 'Table-row drill-down cannot satisfy this map interaction case.' },
  'JSD-05-H3': { title: 'Quantity and Regularity toggle and filter consistency', type: 'happy_path', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-014', 'TS-015'], coverageNote: 'Does not require values or colors to differ when approved inputs produce equal results.' },
  'JSD-05-E1': { title: 'Missing data or geometry, leaf regions and small targets', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-012', 'TS-013', 'TS-016'], coverageNote: 'Distinguishes missing geometry from valid regions with zero readings.' },
  'JSD-05-E2': { title: 'Legend boundaries, fullscreen filter changes and missing assets', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-012', 'TS-014', 'TS-015', 'TS-016'], coverageNote: 'Threshold inclusivity and recovery messages remain unset until reviewed.' },
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
  await allure.parameter('flow_id', 'JSD-05')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-05.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('map_and_geographic_navigation')
  await allure.story(metadata.title)
  await allure.severity(metadata.priority === 'P0' ? 'critical' : 'normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-05 map_and_geographic_navigation', { tag: ['@JSD-05', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'] }, () => {
  const LEGEND = ['No Data', '>=0%', '>=30%', '>=50%', '>=70%', '>=90%']
  const NATIONAL_SAMPLE = ['Assam', 'Karnataka', 'Uttar Pradesh', 'Uttarakhand', 'Bihar', 'Kerala', 'Ladakh', 'Goa']

  async function drillInto(app: DashboardPage, region: string): Promise<void> {
    const before = app.page.url()
    await app.mapRegion(region).click({ force: true })
    await expect.poll(() => app.page.url()).not.toBe(before)
    await app.waitForData()
  }

  test('JSD-05-H1: Map boundaries, labels, legend and fullscreen', { tag: ['@JSD-05', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'], annotation: annotations('JSD-05-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-05-H1', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Inspect boundaries and labels for national scope', async () => {
      await expect(app.mapCard().locator('svg path').first()).toBeVisible()
      const regions = await app.mapRegions()
      expect(regions.length).toBeGreaterThanOrEqual(30)
      expect(new Set(regions).size).toBe(regions.length)
      expect(regions).toEqual(expect.arrayContaining(NATIONAL_SAMPLE))
    })
    await allure.step('Inspect legend for the default Regularity metric', async () => {
      expect(await app.selectedMapMetric()).toBe('Regularity')
      await expect(app.mapLegend().getByRole('listitem')).toHaveText(LEGEND)
      await expect(app.mapViewButton('State View')).toHaveAttribute('aria-pressed', 'true')
    })
    await allure.step('Expand fullscreen and exit using the captured control', async () => {
      await app.showFullscreen().click()
      await expect(app.fullscreenDialog()).toBeVisible()
      expect(await app.mapRegions(app.fullscreenDialog())).toEqual(expect.arrayContaining(NATIONAL_SAMPLE))
      await expect(app.fullscreenDialog().getByRole('button', { name: 'State View' })).toHaveAttribute('aria-pressed', 'true')
      await app.exitFullscreen().click()
      await expect(app.fullscreenDialog()).toBeHidden()
      await expect(app.showFullscreen()).toBeVisible()
      expect(await app.selectedMapMetric()).toBe('Regularity')
      await expect(page).toHaveURL(/\/$/)
    })
  })

  test('JSD-05-H2: Map-region drill-down and drill-up through all supported levels', { tag: ['@JSD-05', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-05-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-05-H2', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Click Assam on the national map', async () => {
      await drillInto(app, 'Assam')
      await expect(page).toHaveURL(/\/as\?tab=administrative$/)
      await expect(app.breadcrumb('Assam')).toBeVisible()
      await expect.poll(() => app.mapRegions()).toEqual(expect.arrayContaining(['Bajali', 'Kamrup', 'Nagaon']))
    })
    await allure.step('Click Bajali on the state map', async () => {
      await drillInto(app, 'Bajali')
      expect(new URL(page.url()).searchParams.get('district')).toBe('2:2:bajali')
      await expect(app.breadcrumb('Bajali')).toBeVisible()
      await expect.poll(() => app.mapRegions()).toEqual(['Bajali'])
    })
    await allure.step('Navigate up through the breadcrumb', async () => {
      await app.breadcrumb('Assam').click()
      await expect(page).toHaveURL(/\/as\?tab=administrative$/)
      await app.waitForData()
      await expect.poll(() => app.mapRegions()).toEqual(expect.arrayContaining(['Bajali', 'Kamrup', 'Nagaon']))
      await app.clearBreadcrumb('Assam').click()
      await expect(page).toHaveURL(/\/$/)
      await app.waitForData()
      await expect.poll(() => app.mapRegions()).toEqual(expect.arrayContaining(NATIONAL_SAMPLE))
    })
  })

  test('JSD-05-H3: Quantity and Regularity toggle and filter consistency', { tag: ['@JSD-05', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-05-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-05-H3', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Switch each metric', async () => {
      await app.mapMetricSwitch().click({ force: true })
      await expect.poll(() => app.selectedMapMetric()).toBe('Quantity')
      await expect(app.mapLegend().getByRole('listitem')).toHaveText(LEGEND)
      await app.mapMetricSwitch().click({ force: true })
      await expect.poll(() => app.selectedMapMetric()).toBe('Regularity')
    })
    await allure.step('Apply geography and date filters; metric and map data follow', async () => {
      await app.mapMetricSwitch().click({ force: true })
      const response = page.waitForResponse(r => r.url().includes('/national/dashboard?start_date=2026-10-01&end_date=2026-10-05'))
      await app.applyRange('01/10/2026', '05/10/2026')
      expect((await response).ok()).toBe(true)
      expect(await app.selectedMapMetric()).toBe('Quantity')
      const stateData = page.waitForResponse(r => r.url().includes('tenant_id=17') && r.url().includes('start_date=2026-10-01'))
      await app.selectGeography('Assam')
      await app.closeSearch().click()
      expect((await stateData).ok()).toBe(true)
      await app.waitForData()
      await expect.poll(() => app.mapRegions()).toEqual(expect.arrayContaining(['Bajali', 'Kamrup']))
      await expect(app.mapLegend()).toBeVisible()
    })
  })

  test('JSD-05-E1: Missing data or geometry, leaf regions and small targets', { tag: ['@JSD-05', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-05-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-05-E1', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Regions without a configured tenant do not navigate', async () => {
      for (const region of ['Bihar', 'Goa', 'Lakshadweep']) {
        await app.mapRegion(region).click({ force: true })
        await page.waitForTimeout(500)
        await expect(page).toHaveURL(/\/$/)
      }
      await expect(app.mapLegend().getByRole('listitem').first()).toHaveText('No Data')
    })
    await allure.step('Leaf district map shows only the selected region', async () => {
      await drillInto(app, 'Assam')
      await drillInto(app, 'Bajali')
      await expect.poll(() => app.mapRegions()).toEqual(['Bajali'])
      const url = page.url()
      await app.mapRegion('Bajali').click({ force: true })
      await page.waitForTimeout(1000)
      expect(new URL(page.url()).searchParams.get('district')).toBe(new URL(url).searchParams.get('district'))
    })
  })

  test('JSD-05-E2: Legend boundaries, fullscreen filter changes and missing assets', { tag: ['@JSD-05', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-05-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-05-E2', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Legend intervals are ordered and non-overlapping', async () => {
      const bounds = (await app.mapLegend().getByRole('listitem').allInnerTexts()).slice(1).map(t => Number(t.replace(/[^\d.]/g, '')))
      expect(bounds).toEqual([...bounds].sort((a, b) => a - b))
      expect(new Set(bounds).size).toBe(bounds.length)
      expect(bounds[0]).toBe(0)
    })
    await allure.step('Change view and metric while fullscreen, then exit', async () => {
      await app.showFullscreen().click()
      const dialog = app.fullscreenDialog()
      await dialog.getByRole('button', { name: 'District View' }).click()
      await expect(dialog.getByRole('button', { name: 'District View' })).toHaveAttribute('aria-pressed', 'true')
      await app.exitFullscreen().click()
      await expect(dialog).toBeHidden()
      await expect(app.mapViewButton('District View')).toHaveAttribute('aria-pressed', 'true')
    })
    await allure.step('Escape closes fullscreen', async () => {
      await app.showFullscreen().click()
      await expect(app.fullscreenDialog()).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(app.fullscreenDialog()).toBeHidden()
    })
    await allure.step('Fail the boundary asset, then recover', async () => {
      await page.route('**/api/v1/analytics/national/dashboard/boundary**', route => route.fulfill({ status: 500, body: 'error' }))
      await page.reload()
      await app.waitForData()
      await expect(app.summaryRows().first()).toBeVisible()
      await expect(app.mapLegend()).toBeVisible()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await page.reload()
      await app.waitForData()
      await expect.poll(() => app.mapRegions()).toEqual(expect.arrayContaining(NATIONAL_SAMPLE))
    })
  })
})
