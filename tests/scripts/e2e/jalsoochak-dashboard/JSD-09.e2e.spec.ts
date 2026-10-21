/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-09.yaml
 * Flow: JSD-09 - footer_and_public_destinations
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-09
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-09.fixtures'
import { DashboardPage } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-09.yaml'
const caseMetadata = {
  'JSD-09-H1': { title: 'Officer and system login destinations and public glossary', type: 'happy_path', priority: 'P1', tags: ['smoke', 'regression'], scenarioIds: ['TS-030'], coverageNote: 'Two links sharing a destination must still be verified as separate labeled links.' },
  'JSD-09-H2': { title: 'Website, social, mail and attribution destinations', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-030', 'TS-031', 'TS-033'], coverageNote: 'Destination correctness is distinct from external website availability.' },
  'JSD-09-H3': { title: 'Required footer links, contact details, copyright and visitor section', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-030', 'TS-032', 'TS-033'], coverageNote: 'Missing plan requirements are not silently omitted because the current contract lacks them.' },
  'JSD-09-E1': { title: 'Relative links, blocked tabs and unavailable external destinations', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-030', 'TS-031'], coverageNote: 'Does not classify a correct href as an application defect merely because a third party is down.' },
  'JSD-09-E2': { title: 'Keyboard access, year rollover and unavailable visitor count', type: 'edge_case', priority: 'P2', tags: ['regression'], scenarioIds: ['TS-031', 'TS-032', 'TS-033'], coverageNote: "Does not assume the copyright year must always equal the machine's current year." },
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
  await allure.parameter('flow_id', 'JSD-09')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-09.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('footer_and_public_destinations')
  await allure.story(metadata.title)
  await allure.severity(metadata.priority === 'P2' ? 'minor' : 'normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-09 footer_and_public_destinations', { tag: ['@JSD-09', '@jalsoochak-dashboard', '@P1', '@smoke', '@regression'] }, () => {
  const INTERNAL = [
    { name: 'Sub-Divisional Officer login', href: '/staff/login' },
    { name: 'Section Officer login', href: '/staff/login' },
    { name: 'System Users login', href: '/login' },
    { name: 'Dashboard Glossary', href: '/glossary' },
  ]
  const EXTERNAL = [
    { name: 'JalSoochak website', href: 'https://jalsoochak.in/' },
    { name: 'X (Twitter)', href: 'https://x.com/arghyamindia' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/arghyam/' },
    { name: 'Arghyam', href: 'https://arghyam.org/' },
  ]
  const FOOTER_ORDER = ['X (Twitter)', 'LinkedIn', 'Email', 'Sub-Divisional Officer login', 'Section Officer login', 'System Users login', 'JalSoochak website', 'Dashboard Glossary', 'Arghyam']
  const EXTERNAL_HOSTS = /^https:\/\/(jalsoochak\.in|x\.com|www\.linkedin\.com|arghyam\.org)\//

  test('JSD-09-H1: Officer and system login destinations and public glossary', { tag: ['@JSD-09', '@jalsoochak-dashboard', '@P1', '@smoke', '@regression'], annotation: annotations('JSD-09-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-09-H1', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Inspect each officer and system login href', async () => {
      for (const link of INTERNAL) await expect(app.footerLink(link.name)).toHaveAttribute('href', link.href)
    })
    for (const link of INTERNAL.slice(0, 3)) {
      await allure.step(`${link.name} opens ${link.href} without submitting a form`, async () => {
        await app.goto('/')
        await app.footerLink(link.name).click()
        await expect(page).toHaveURL(new RegExp(`${link.href.replace(/\//g, '\\/')}$`))
        await expect(page.locator('input[type="password"], input[type="tel"], input[type="text"], input[type="email"]').first()).toBeVisible()
      })
    }
    await allure.step('Open public glossary, check its route and restore the dashboard', async () => {
      await app.goto('/')
      await app.footerLink('Dashboard Glossary').click()
      await expect(page).toHaveURL(/\/glossary$/)
      await expect(page.getByText('Dashboard Glossary', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Definitions and formulas for all metrics, charts, and indicators used in this dashboard.')).toBeVisible()
      await page.goBack()
      await expect(page).toHaveURL(/\/$/)
      await app.waitForData()
    })
  })

  test('JSD-09-H2: Website, social, mail and attribution destinations', { tag: ['@JSD-09', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-09-H2') }, async ({ page, context }, testInfo) => {
    await reportMetadata('JSD-09-H2', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Destinations match the contract hrefs', async () => {
      for (const link of EXTERNAL) await expect(app.footerLink(link.name)).toHaveAttribute('href', link.href)
    })
    await allure.step('External links open in a new tab and keep the dashboard', async () => {
      await context.route(EXTERNAL_HOSTS, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }))
      for (const link of EXTERNAL) {
        const [popup] = await Promise.all([context.waitForEvent('page'), app.footerLink(link.name).click()])
        await popup.waitForLoadState()
        expect(popup.url()).toBe(link.href)
        await popup.close()
        await expect(page).toHaveURL(/\/$/)
      }
    })
    await allure.step('Mail link uses the approved contact without invoking a client', async () => {
      await expect(app.footerLink('Email')).toHaveAttribute('href', 'mailto:info@arghyam.org')
    })
  })

  test('JSD-09-H3: Required footer links, contact details, copyright and visitor section', { tag: ['@JSD-09', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-09-H3') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-09-H3', testInfo)
    const app = new DashboardPage(page)
    await page.clock.setFixedTime(new Date('2026-10-14T10:00:00+05:30'))
    await app.goto('/')
    await allure.step('Required footer links and description are present', async () => {
      for (const name of FOOTER_ORDER) await expect(app.footerLink(name)).toBeVisible()
      await expect(page.getByText('Quick Links', { exact: true })).toBeVisible()
      await expect(page.getByText(/^AI-enabled water supply monitoring for India's Rural Water Supply\./)).toBeVisible()
    })
    await allure.step('Contact details match the reference', async () => {
      await expect(page.getByText('Contact Us', { exact: true })).toBeVisible()
      await expect(page.getByText('info@arghyam.org', { exact: true })).toBeVisible()
      await expect(page.getByText('+91-80 4169 8941', { exact: true })).toBeVisible()
      await expect(page.getByText('#599, ROHINI, 12th Main Rd, 7th Cross, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560068', { exact: true })).toBeVisible()
    })
    await allure.step('Copyright and attribution; no visitor-count section is rendered', async () => {
      await expect(app.copyright()).toHaveText('© 2026 JalSoochak · An initiative by Arghyam')
      await expect(page.getByText(/visitor/i)).toHaveCount(0)
    })
  })

  test('JSD-09-E1: Relative links, blocked tabs and unavailable external destinations', { tag: ['@JSD-09', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-09-E1') }, async ({ page, context, baseURL }, testInfo) => {
    await reportMetadata('JSD-09-E1', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Relative destinations resolve against the base URL', async () => {
      for (const link of INTERNAL) {
        expect(await app.footerLink(link.name).evaluate((a: HTMLAnchorElement) => a.href)).toBe(new URL(link.href, baseURL).toString())
      }
    })
    await allure.step('Simulated unavailable external site fails in its own tab only', async () => {
      await context.route(EXTERNAL_HOSTS, route => route.abort('internetdisconnected'))
      const [popup] = await Promise.all([context.waitForEvent('page'), app.footerLink('JalSoochak website').click()])
      await popup.waitForLoadState().catch(() => undefined)
      expect(popup.url()).toMatch(/^(https:\/\/jalsoochak\.in\/|chrome-error:\/\/chromewebdata\/)$/)
      await popup.close()
      await expect(page).toHaveURL(/\/$/)
      await expect(app.durationButton()).toBeVisible()
      await context.unrouteAll({ behavior: 'ignoreErrors' })
    })
    await allure.step('A blocked popup leaves the dashboard usable', async () => {
      await page.evaluate(() => { window.open = () => null })
      await app.footerLink('Arghyam').click({ modifiers: [] }).catch(() => undefined)
      await expect(page).toHaveURL(/\/$/)
      await expect(app.durationButton()).toBeVisible()
    })
  })

  test('JSD-09-E2: Keyboard access, year rollover and unavailable visitor count', { tag: ['@JSD-09', '@jalsoochak-dashboard', '@P2', '@regression'], annotation: annotations('JSD-09-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-09-E2', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Navigate footer controls by keyboard', async () => {
      await app.goto('/')
      await app.footerLink(FOOTER_ORDER[0]).focus()
      for (const name of FOOTER_ORDER.slice(1)) {
        await page.keyboard.press('Tab')
        await expect(app.footerLink(name)).toBeFocused()
      }
    })
    for (const [now, year] of [['2026-12-31T23:59:00+05:30', '2026'], ['2027-01-01T00:01:00+05:30', '2027']] as const) {
      await allure.step(`Copyright year at ${now} is ${year}`, async () => {
        await page.clock.setFixedTime(new Date(now))
        await page.reload()
        await expect(app.copyright()).toHaveText(`© ${year} JalSoochak · An initiative by Arghyam`)
      })
    }
    await allure.step('No visitor count is shown, so no placeholder value can leak', async () => {
      await expect(page.getByText(/visitor/i)).toHaveCount(0)
    })
  })
})
