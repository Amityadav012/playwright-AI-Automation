/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-03.yaml
 * Flow: JSD-03 - geography_and_filter_lifecycle
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-03
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-03.fixtures'
import { DashboardPage } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-03.yaml'
const caseMetadata = {
  'JSD-03-H1': { title: 'Select a valid administrative hierarchy', type: 'happy_path', priority: 'P0', tags: ['smoke', 'regression'], scenarioIds: ['TS-004'], coverageNote: 'Checks each hierarchy relationship rather than merely typing into search.' },
  'JSD-03-H2': { title: 'Select valid Departmental Zone and Circle', type: 'happy_path', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-005'], coverageNote: 'Uses a real mapping instead of assuming Departmental fields mirror Administrative fields.' },
  'JSD-03-H3': { title: 'Matching search in both geography modes', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-004', 'TS-005', 'TS-007'], coverageNote: 'Covers result selection as well as input value acceptance.' },
  'JSD-03-E1': { title: 'No matches, Unicode, whitespace, punctuation and duplicate names', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-007'], coverageNote: 'Does not fabricate a no-result message or search case-sensitivity rule.' },
  'JSD-03-E2': { title: 'Change selected parent, switch modes and clear or close filters', type: 'edge_case', priority: 'P0', tags: ['regression'], scenarioIds: ['TS-004', 'TS-005', 'TS-006', 'TS-008'], coverageNote: 'Separates closing a menu from resetting selected filters.' },
  'JSD-03-E3': { title: 'Rapid searches, out-of-order responses and leaf nodes', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-004', 'TS-005', 'TS-007'], coverageNote: 'Avoids treating stale responses as valid current selections.' },
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
  await allure.parameter('flow_id', 'JSD-03')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-03.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('geography_and_filter_lifecycle')
  await allure.story(metadata.title)
  await allure.severity(metadata.priority === 'P0' ? 'critical' : 'normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-03 geography_and_filter_lifecycle', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'] }, () => {
  // Captured QA hierarchy (Assam tenant).
  const ADMIN_PATH = [
    { name: 'Assam', param: null, store: 'selectedState', value: 'assam', children: /^Districts \(\d+\)$/ },
    { name: 'Bajali', param: 'district', store: 'selectedDistrict', value: '2:2:bajali', children: /^Blocks \(\d+\)$/ },
    { name: 'Bajali', param: 'block', store: 'selectedBlock', value: '38:38:bajali', children: /^Panchayats \(\d+\)$/ },
    { name: 'Baghmara', param: 'gramPanchayat', store: 'selectedGramPanchayat', value: '279:279:baghmara', children: /^Villages \(\d+\)$/ },
    { name: 'Baghmara', param: 'village', store: 'selectedVillage', value: '2968:2968:baghmara', children: /^Villages \(\d+\)$/ },
  ] as const
  const DEPT_PATH = [
    { name: 'Lower Assam Zone', param: 'departmentZone', store: 'selectedDepartmentZone', value: '2:2:lower-assam-zone', children: /^Circles \(\d+\)$/ },
    { name: 'Guwahati Circle', param: 'departmentCircle', store: 'selectedDepartmentCircle', value: '9:9:guwahati-circle', children: /^Divisions \(\d+\)$/ },
  ] as const

  async function openAssamDepartmental(app: DashboardPage): Promise<void> {
    await app.goto('/as?tab=administrative')
    await app.openSearch()
    await app.modeTab('Departmental').click()
    await expect(app.modeTab('Departmental')).toHaveAttribute('aria-selected', 'true')
    await expect(app.optionsHeading()).toHaveText(/^Zones \(\d+\)$/)
  }

  test('JSD-03-H1: Select a valid administrative hierarchy', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P0', '@smoke', '@regression'], annotation: annotations('JSD-03-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-03-H1', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('National scope lists states; geography modes are locked until a state is chosen', async () => {
      await app.openSearch()
      await expect(app.optionsHeading()).toHaveText(/^States \(\d+\)$/)
      await expect(app.searchOption('Assam')).toBeVisible()
      await expect(app.modeTab('Administrative')).toBeDisabled()
      await expect(app.modeTab('Departmental')).toBeDisabled()
    })
    for (const [depth, level] of ADMIN_PATH.entries()) {
      await allure.step(`Select ${level.name} and observe child options and applied context`, async () => {
        await app.selectGeography(level.name)
        await app.openSearch()
        await expect(app.optionsHeading()).toHaveText(level.children)
        await expect(app.searchOptions().getByRole('button').first()).toBeVisible()
        await expect(page).toHaveURL(/\/as\?tab=administrative/)
        if (level.param) expect(new URL(page.url()).searchParams.get(level.param)).toBe(level.value)
        expect((await app.storedFilters())[level.store]).toBe(level.value)
        // Breadcrumb trail: All States/UTs + every selected level.
        await expect(app.breadcrumbs()).toHaveText(['All States/UTs', ...ADMIN_PATH.slice(0, depth + 1).map(l => l.name)])
      })
    }
  })

  test('JSD-03-H2: Select valid Departmental Zone and Circle', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-03-H2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-03-H2', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Open Departmental mode', async () => { await openAssamDepartmental(app) })
    for (const [depth, level] of DEPT_PATH.entries()) {
      await allure.step(`Select ${level.name}`, async () => {
        await app.selectGeography(level.name)
        await app.openSearch()
        await expect(app.optionsHeading()).toHaveText(level.children)
        expect(new URL(page.url()).searchParams.get(level.param)).toBe(level.value)
        const stored = await app.storedFilters()
        expect(stored[level.store]).toBe(level.value)
        expect(stored.filterTabIndex).toBe(1)
        await expect(app.breadcrumbs()).toHaveText(['All States/UTs', 'Assam', ...DEPT_PATH.slice(0, depth + 1).map(l => l.name)])
      })
    }
    await allure.step('Assert: circle_options_match_selected_zone', async () => {
      await app.breadcrumb('Lower Assam Zone').click()
      await app.openSearch()
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Guwahati Circle', 'Nalbari Circle'])
    })
  })

  test('JSD-03-H3: Matching search in both geography modes', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-03-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-03-H3', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Administrative: exact and partial, case-insensitive matches', async () => {
      await app.openSearch()
      await app.search().fill('Assam')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Assam'])
      await app.search().fill('kar')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Karnataka'])
      await app.search().fill('uttar')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Uttar Pradesh', 'Uttarakhand'])
    })
    await allure.step('Select a result and check its identity', async () => {
      await app.search().fill('ass')
      await app.selectGeography('Assam')
      await expect(page).toHaveURL(/\/as\?tab=administrative$/)
      await app.openSearch()
      await app.search().fill('kamrup')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Kamrup', 'Kamrup Metro'])
    })
    await allure.step('Departmental: partial match and selection', async () => {
      await openAssamDepartmental(app)
      await app.search().fill('lower')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Lower Assam Zone'])
      await app.selectGeography('Lower Assam Zone')
      expect(new URL(page.url()).searchParams.get('departmentZone')).toBe('2:2:lower-assam-zone')
    })
  })

  test('JSD-03-E1: No matches, Unicode, whitespace, punctuation and duplicate names', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-03-E1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-03-E1', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await app.openSearch()
    for (const [variant, query] of [['no_match', 'zzzz'], ['unicode', 'असम'], ['punctuation', '%_*']] as const) {
      await allure.step(`Search variant "${variant}" shows the empty-result state`, async () => {
        await app.search().fill(query)
        await expect(app.main().getByText('No states found')).toBeVisible()
        await expect(app.searchOptions().getByRole('button')).toHaveCount(0)
      })
    }
    await allure.step('Surrounding whitespace is ignored', async () => {
      await app.search().fill('  Assam  ')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Assam'])
    })
    await allure.step('Similar names select only the intended district', async () => {
      await app.search().fill('')
      await app.selectGeography('Assam')
      await app.openSearch()
      await app.search().fill('Karbi Anglong')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Karbi Anglong', 'West Karbi Anglong'])
      await app.selectGeography('Karbi Anglong')
      await expect(app.breadcrumbs().last()).toHaveText('Karbi Anglong')
      expect(new URL(page.url()).searchParams.get('district')).toMatch(/:karbi-anglong$|:karbi anglong$|:karbi%20anglong$|karbi/)
      expect(new URL(page.url()).searchParams.get('district')).not.toMatch(/west/)
    })
  })

  test('JSD-03-E2: Change selected parent, switch modes and clear or close filters', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P0', '@regression'], annotation: annotations('JSD-03-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-03-E2', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Change parent after selecting a child resets the child', async () => {
      await app.applyRange('01/10/2026', '05/10/2026')
      await app.selectGeography('Assam')
      await app.selectGeography('Bajali')
      await app.breadcrumb('Assam').click()
      await expect(page).toHaveURL(/\/as\?tab=administrative$/)
      await expect.poll(async () => (await app.storedFilters()).selectedDistrict).toBe('')
      await expect(app.durationButton()).toHaveText('01/10/2026-05/10/2026')
    })
    await allure.step('Switching mode keeps dates and state, and shows mode-specific fields', async () => {
      await app.openSearch()
      await app.modeTab('Departmental').click()
      await expect(app.optionsHeading()).toHaveText(/^Zones \(\d+\)$/)
      await expect(app.search()).toHaveAttribute('placeholder', 'Search by Zone')
      await expect(app.durationButton()).toHaveText('01/10/2026-05/10/2026')
      await app.modeTab('Administrative').click()
      await expect(app.optionsHeading()).toHaveText(/^Districts \(\d+\)$/)
      await expect(app.search()).toHaveAttribute('placeholder', 'Search by District')
    })
    await allure.step('Close the dropdown with its close control and with an outside click', async () => {
      await app.closeSearch().click()
      await expect(app.searchOptions()).toBeHidden()
      await app.openSearch()
      await app.header().click({ position: { x: 5, y: 5 } })
      await expect(app.searchOptions()).toBeHidden()
    })
    await allure.step('Refresh keeps the selected scope; Back returns to the previous route', async () => {
      await page.reload()
      await app.waitForData()
      await expect(page).toHaveURL(/\/as\?tab=administrative/)
      await expect(app.breadcrumb('Assam')).toBeVisible()
    })
    await allure.step('Clear all filters twice returns to the national baseline', async () => {
      await app.clearAllFilters().click()
      await expect(page).toHaveURL(/\/$/)
      await expect(app.durationButton()).not.toHaveText('01/10/2026-05/10/2026')
      await expect(app.clearAllFilters()).toBeDisabled()
      const stored = await app.storedFilters()
      expect([stored.selectedState, stored.selectedDistrict, stored.selectedDuration]).toEqual(['', '', null])
    })
  })

  test('JSD-03-E3: Rapid searches, out-of-order responses and leaf nodes', { tag: ['@JSD-03', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-03-E3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-03-E3', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/as?tab=administrative')
    await allure.step('Issue rapid successive searches; results follow the latest query', async () => {
      await app.openSearch()
      await app.search().pressSequentially('Bajal', { delay: 10 })
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Bajali'])
      await app.search().fill('Ka')
      await app.search().fill('Kam')
      await expect(app.searchOptions().getByRole('button')).toHaveText(['Kamrup', 'Kamrup Metro'])
      await app.search().fill('')
    })
    await allure.step('Select a leaf village: no further level is offered', async () => {
      for (const level of ADMIN_PATH.slice(1)) await app.selectGeography(level.name)
      await app.openSearch()
      await expect(app.optionsHeading()).toHaveText(/^Villages \(\d+\)$/)
      expect(new URL(page.url()).searchParams.get('village')).toBe('2968:2968:baghmara')
      await expect(app.breadcrumbs()).toHaveText(['All States/UTs', ...ADMIN_PATH.map(l => l.name)])
      // Choosing a sibling village replaces the leaf rather than nesting deeper.
      const sibling = (await app.searchOptions().getByRole('button').allInnerTexts()).find(n => n !== 'Baghmara')!
      await app.selectGeography(sibling)
      await expect(app.breadcrumbs().last()).toHaveText(sibling)
      const params = new URL(page.url()).searchParams
      expect(params.get('village')).toMatch(new RegExp(`^\\d+:\\d+:${sibling.toLowerCase().split(/[^a-z]+/)[0]}`))
      expect(params.get('gramPanchayat')).toBe('279:279:baghmara')
    })
  })
})
