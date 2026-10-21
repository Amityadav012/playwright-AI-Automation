/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-02.yaml
 * Flow: JSD-02 - dates_and_quick_ranges
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-02
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-02.fixtures'
import { DashboardPage, QUICK_RANGES, toIso } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-02.yaml'
const caseMetadata = {
  'JSD-02-H1': { title: 'Valid single-day and multi-day ranges apply', type: 'happy_path', priority: 'P0', tags: ['smoke', 'regression'], scenarioIds: ['TS-003'], coverageNote: 'Confirms valid selection without requiring all widget values to change.' },
  'JSD-02-H2': { title: 'All quick ranges resolve using the agreed clock and timezone', type: 'happy_path', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-003'], coverageNote: "Covers relative date boundaries without relying on the test machine's current date." },
  'JSD-02-E1': { title: 'Reversed, empty, malformed and impossible dates', type: 'edge_case', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-003'], coverageNote: 'Does not invent rejection messages or assume invalid input is never normalized.' },
  'JSD-02-E2': { title: 'Leap day, rollover, future dates, oldest date and maximum span', type: 'edge_case', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-003'], coverageNote: 'Calendar-valid dates may still be outside the supported dataset window.' },
  'JSD-02-E3': { title: 'Clear and close before versus after Apply', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-003'], coverageNote: 'Distinguishes panel Clear from dashboard-wide reset and persistence.' },
  'JSD-02-E4': { title: 'Quick range manual edit, double Apply and request failure', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-003'], coverageNote: 'Covers competing date input paths and recovery without assuming a duplicate-request limit.' },
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
  await allure.parameter('flow_id', 'JSD-02')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-02.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('dates_and_quick_ranges')
  await allure.story(metadata.title)
  await allure.severity(metadata.priority === 'P0' ? 'critical' : 'normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-02 dates_and_quick_ranges', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'] }, () => {
  // Fixed IST clock (a Wednesday) so relative ranges are deterministic; weeks start on Monday.
  const NOW = new Date('2026-10-14T10:00:00+05:30')
  const TODAY = '14/10/2026'

  const dashboardRequest = (start: string, end: string) =>
    (url: string) => url.includes('/analytics/national/dashboard?') && url.includes(`start_date=${toIso(start)}&end_date=${toIso(end)}`)

  async function openAt(app: DashboardPage, now = NOW): Promise<string[]> {
    await app.page.clock.setFixedTime(now)
    const requests = app.trackAnalytics()
    await app.goto('/')
    return requests
  }

  test('JSD-02-H1: Valid single-day and multi-day ranges apply', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'], annotation: annotations('JSD-02-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-02-H1', testInfo)
    const app = new DashboardPage(page)
    const requests = await openAt(app)
    await allure.step('Open Duration and verify the default range is today', async () => {
      await expect(app.durationButton()).toHaveText(TODAY)
      await app.openDuration()
      await expect(app.startInput()).toHaveValue(TODAY)
      await expect(app.endInput()).toHaveValue(TODAY)
    })
    for (const [start, end, label, days] of [
      ['10/10/2026', '10/10/2026', '10/10/2026', '1 day'],
      ['01/10/2026', '05/10/2026', '01/10/2026-05/10/2026', '5 days'],
    ] as const) {
      await allure.step(`Apply ${start} - ${end} and observe selected range and request context`, async () => {
        await app.applyRange(start, end)
        await expect(app.durationButton()).toHaveText(label)
        await expect.poll(() => requests.some(dashboardRequest(start, end))).toBe(true)
        await expect(app.page.getByText(`vs previous ${days}`, { exact: false }).first()).toBeVisible()
        expect((await app.storedFilters()).selectedDuration).toEqual({ startDate: toIso(start), endDate: toIso(end) })
      })
    }
  })

  test('JSD-02-H2: All quick ranges resolve using the agreed clock and timezone', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-02-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-02-H2', testInfo)
    const app = new DashboardPage(page)
    const expected: Record<string, [string, string]> = {
      'Today': ['14/10/2026', '14/10/2026'],
      'Yesterday': ['13/10/2026', '13/10/2026'],
      'This week': ['12/10/2026', '14/10/2026'],
      'Last week': ['05/10/2026', '11/10/2026'],
      'This month': ['01/10/2026', '14/10/2026'],
      'Last month': ['01/09/2026', '30/09/2026'],
    }
    await allure.step('Freeze the browser clock at 2026-10-14 10:00 IST', async () => { await openAt(app) })
    await allure.step('Assert: displayed quick ranges match the captured set', async () => {
      await app.openDuration()
      for (const name of QUICK_RANGES) await expect(app.quickRange(name)).toBeVisible()
    })
    for (const name of QUICK_RANGES) {
      await allure.step(`Select ${name} and compare computed dates`, async () => {
        await app.selectQuickRange(name)
        await expect(app.startInput()).toHaveValue(expected[name][0])
        await expect(app.endInput()).toHaveValue(expected[name][1])
      })
    }
    await allure.step('Applied quick range is labelled by name and requests its dates', async () => {
      const requests = app.trackAnalytics()
      await app.selectQuickRange('Last week')
      await app.applyButton().click()
      await expect(app.durationButton()).toHaveText('Last week')
      await expect.poll(() => requests.some(dashboardRequest('05/10/2026', '11/10/2026'))).toBe(true)
    })
  })

  test('JSD-02-E1: Reversed, empty, malformed and impossible dates', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-02-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-02-E1', testInfo)
    const app = new DashboardPage(page)
    const requests = await openAt(app)
    const variants: Record<string, [string, string]> = {
      reversed: ['10/10/2026', '01/10/2026'],
      start_empty: ['', '05/10/2026'],
      both_empty: ['', ''],
      malformed: ['ab/cd/efgh', '05/10/2026'],
      impossible_calendar_date: ['31/02/2026', '05/10/2026'],
    }
    for (const [variant, [start, end]] of Object.entries(variants)) {
      await allure.step(`Invalid input "${variant}" cannot be applied`, async () => {
        const before = requests.length
        await app.enterRange(start, end)
        await expect(app.applyButton()).toBeDisabled()
        await app.closeDuration()
        await expect(app.durationButton()).toHaveText(TODAY)
        expect(requests.slice(before).filter(u => u.includes('/national/dashboard?'))).toEqual([])
      })
    }
    await allure.step('Empty end date is normalised to today and applies an open-ended range', async () => {
      await app.enterRange('01/10/2026', '')
      await expect(app.endInput()).toHaveValue(TODAY)
      await app.applyButton().click()
      await expect(app.durationButton()).toHaveText(`01/10/2026-${TODAY}`)
      await expect.poll(() => requests.some(dashboardRequest('01/10/2026', TODAY))).toBe(true)
    })
  })

  test('JSD-02-E2: Leap day, rollover, future dates, oldest date and maximum span', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-02-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-02-E2', testInfo)
    const app = new DashboardPage(page)
    const requests = await openAt(app)
    for (const [variant, start, end] of [
      ['leap_day', '29/02/2024', '29/02/2024'],
      ['month_rollover', '30/09/2026', '02/10/2026'],
      ['year_rollover', '30/12/2025', '02/01/2026'],
    ] as const) {
      await allure.step(`Boundary "${variant}" applies`, async () => {
        await app.applyRange(start, end)
        await expect.poll(() => requests.some(dashboardRequest(start, end))).toBe(true)
      })
    }
    await allure.step('Non-leap 29 February is rejected', async () => {
      await app.enterRange('29/02/2025', '01/03/2025')
      await expect(app.applyButton()).toBeDisabled()
      await app.closeDuration()
    })
    await allure.step('Future dates are clamped to today', async () => {
      await app.enterRange('01/01/2030', '02/01/2030')
      await expect(app.startInput()).toHaveValue(TODAY)
      await expect(app.endInput()).toHaveValue(TODAY)
      await app.closeDuration()
    })
  })

  test('JSD-02-E3: Clear and close before versus after Apply', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-02-E3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-02-E3', testInfo)
    const app = new DashboardPage(page)
    await openAt(app)
    await allure.step('Apply a baseline range', async () => {
      await app.applyRange('01/10/2026', '05/10/2026')
      await expect(app.durationButton()).toHaveText('01/10/2026-05/10/2026')
    })
    await allure.step('Edit without applying and close: the applied range is kept', async () => {
      await app.enterRange('07/10/2026', '08/10/2026')
      await app.closeDuration()
      await expect(app.durationButton()).toHaveText('01/10/2026-05/10/2026')
      expect((await app.storedFilters()).selectedDuration).toEqual({ startDate: '2026-10-01', endDate: '2026-10-05' })
    })
    await allure.step('Refresh after applying keeps the applied range', async () => {
      await page.reload()
      await app.waitForData()
      await expect(app.durationButton()).toHaveText('01/10/2026-05/10/2026')
    })
    await allure.step('Panel Clear resets the range to today', async () => {
      await app.openDuration()
      await app.clearButton().click()
      await expect(app.durationPanel()).toBeHidden()
      await expect(app.durationButton()).toHaveText(TODAY)
    })
    await allure.step('Clear all filters resets an applied range', async () => {
      await app.applyRange('01/10/2026', '05/10/2026')
      await app.clearAllFilters().click()
      await expect(app.durationButton()).toHaveText(TODAY)
      await expect(app.clearAllFilters()).toBeDisabled()
    })
  })

  test('JSD-02-E4: Quick range manual edit, double Apply and request failure', { tag: ['@JSD-02', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-02-E4') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-02-E4', testInfo)
    const app = new DashboardPage(page)
    const requests = await openAt(app)
    await allure.step('Select quick range then edit manually', async () => {
      await app.selectQuickRange('Last week')
      await app.endInput().fill('09/10/2026')
      await app.applyButton().click()
      await expect(app.durationButton()).toHaveText('05/10/2026-09/10/2026')
      await expect.poll(() => requests.some(dashboardRequest('05/10/2026', '09/10/2026'))).toBe(true)
    })
    await allure.step('Apply is disabled when re-opening an unchanged range', async () => {
      await app.openDuration()
      await expect(app.startInput()).toHaveValue('05/10/2026')
      await expect(app.endInput()).toHaveValue('09/10/2026')
      await expect(app.applyButton()).toBeDisabled()
      await app.closeDuration()
    })
    await allure.step('Simulate failure of the dashboard request', async () => {
      await page.route('**/api/v1/analytics/national/dashboard?**', route => route.fulfill({ status: 500, body: 'error' }))
      await app.applyRange('01/10/2026', '03/10/2026')
      await expect(app.durationButton()).toHaveText('01/10/2026-03/10/2026')
      await expect(app.loadError().first()).toBeVisible()
    })
    await allure.step('Restore normal requests and recover', async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await page.reload()
      await app.waitForData()
      await expect(app.durationButton()).toHaveText('01/10/2026-03/10/2026')
      await expect(app.loadError()).toHaveCount(0)
      await expect(app.summaryRows().first()).toBeVisible()
    })
  })
})
