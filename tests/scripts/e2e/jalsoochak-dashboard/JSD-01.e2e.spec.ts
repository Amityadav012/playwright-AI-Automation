/**
 * Generated from the DSL, then implemented against behaviour observed on the QA environment.
 * Source: testcases/jalsoochak-dashboard/JSD-01.yaml
 * Flow: JSD-01 - header_and_languages
 * Contract: jalsoochak-contract.json v1.2.0
 * Generator: /playwright-gen jalsoochak-dashboard JSD-01
 */
import { test, expect, type TestInfo } from '@playwright/test'
import { allure } from 'allure-playwright'
import { fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-01.fixtures'
import { DashboardPage, LANGUAGE_CODES, type Language } from '../../pages/DashboardPage.page'

const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-01.yaml'
const caseMetadata = {
  'JSD-01-H1': { title: 'Header logo, title and home destination', type: 'happy_path', priority: 'P1', tags: ['smoke', 'regression'], scenarioIds: ['TS-001'], coverageNote: 'Header-only scoping prevents footer logo duplication from satisfying the assertion.' },
  'JSD-01-H2': { title: 'Each available language applies approved translated labels', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-002'], coverageNote: 'A closed language menu alone does not prove translation applied.' },
  'JSD-01-E1': { title: 'Language persistence across refresh, route change and second tab', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-002'], coverageNote: 'Observes persistence before reset; does not assume all contexts share language state.' },
  'JSD-01-E2': { title: 'Repeated switching, long translations and keyboard interaction', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-001', 'TS-002'], coverageNote: 'Covers stale language updates and translated layout without creating an unapproved visual baseline.' },
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
  await allure.parameter('flow_id', 'JSD-01')
  await allure.parameter('module', 'jalsoochak-dashboard')
  await allure.parameter('type', metadata.type)
  await allure.parameter('priority', metadata.priority)
  await allure.parameter('test_data_ref', caseId)
  await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-01.fixtures.ts#${caseId}`)
  await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  await allure.parameter('yaml_source', YAML_SOURCE)
  await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  await allure.epic('jalsoochak-dashboard')
  await allure.feature('header_and_languages')
  await allure.story(metadata.title)
  await allure.severity('normal')
  for (const tag of metadata.tags) await allure.tag(tag)
  await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
}

test.describe('JSD-01 header_and_languages', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@smoke', '@regression'] }, () => {
  // Translated header samples observed on QA; the subtitle is the dashboard title shown beside the logo.
  const SAMPLES: Record<Language, { subtitle: string, logo: string | null, script: RegExp }> = {
    English: { subtitle: 'National Rural Drinking Water Supply Dashboard', logo: 'JalSoochak logo with text', script: /^[\x20-\x7E]+$/ },
    Hindi: { subtitle: 'जल आपूर्ति योजनाओं की परिचालन स्थिति', logo: 'जलसूचक लोगो टेक्स्ट के साथ', script: /[ऀ-ॿ]/ },
    Assamese: { subtitle: 'ৰাষ্ট্ৰীয় গ্ৰামীণ পানীয় পানী যোগান ডেচবৰ্ড', logo: null, script: /[ঀ-৿]/ },
  }
  // Compare canonically: the app emits precomposed Bengali-script letters (e.g. U+09DF).
  const expectSubtitle = (app: DashboardPage, language: Language) =>
    expect.poll(async () => (await app.subtitle().innerText()).normalize('NFC')).toBe(SAMPLES[language].subtitle.normalize('NFC'))

  test('JSD-01-H1: Header logo, title and home destination', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@smoke', '@regression'], annotation: annotations('JSD-01-H1') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-01-H1', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Load the agreed route', async () => {
      await app.goto('/')
      await expect(page).toHaveTitle('JalSoochak')
    })
    await allure.step('Inspect header logo and dashboard title', async () => {
      await expect(app.logoImage()).toBeVisible()
      await expect(app.logoImage()).toHaveAccessibleName(SAMPLES.English.logo!)
      const logoBox = await app.logoImage().boundingBox()
      expect(logoBox?.width ?? 0).toBeGreaterThan(0)
      await expectSubtitle(app, 'English')
      await expect(app.languageButton()).toBeVisible()
    })
    await allure.step('Inspect the header home link destination', async () => {
      await expect(app.logoLink()).toHaveCount(1)
      await expect(app.logoLink()).toHaveAttribute('href', '/')
      await page.goto('/glossary')
      await expect(page.getByText('Dashboard Glossary', { exact: true }).first()).toBeVisible()
      await app.logoLink().click()
      await expect(page).toHaveURL(/\/$/)
      await expect(app.durationButton()).toBeVisible()
    })
  })

  test('JSD-01-H2: Each available language applies approved translated labels', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-01-H2') }, async ({ browser, page }, testInfo) => {
    await reportMetadata('JSD-01-H2', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Discover all available language options', async () => {
      await app.goto('/')
      await app.languageButton().click()
      await expect(app.languageOptions()).toHaveText([/^English\s*English$/, /^Hindi\s*हिन्दी$/, /^Assamese\s*অসমীয়া$/])
      await page.keyboard.press('Escape')
    })
    for (const language of Object.keys(SAMPLES) as Language[]) {
      await allure.step(`Select ${language} in an isolated context and compare labels`, async () => {
        const context = await browser.newContext()
        try {
          const isolated = new DashboardPage(await context.newPage())
          await isolated.goto('/')
          await isolated.selectLanguage(language)
          await expectSubtitle(isolated, language)
          expect(await isolated.subtitle().innerText()).toMatch(SAMPLES[language].script)
          if (SAMPLES[language].logo) await expect(isolated.logoImage()).toHaveAccessibleName(SAMPLES[language].logo!)
          expect(await isolated.storedLanguage()).toBe(LANGUAGE_CODES[language])
        } finally {
          await context.close()
        }
      })
    }
  })

  test('JSD-01-E1: Language persistence across refresh, route change and second tab', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-01-E1') }, async ({ browser, context, page }, testInfo) => {
    await reportMetadata('JSD-01-E1', testInfo)
    const app = new DashboardPage(page)
    await allure.step('Select a non-baseline available language', async () => {
      await app.goto('/')
      await app.selectLanguage('Hindi')
      await expectSubtitle(app, 'Hindi')
    })
    await allure.step('Refresh within the same context', async () => {
      await page.reload()
      await expectSubtitle(app, 'Hindi')
    })
    await allure.step('Navigate to a public route and open a second tab', async () => {
      await page.goto('/glossary')
      await expect(page.getByText('डैशबोर्ड शब्दावली', { exact: true })).toBeVisible()
      const secondTab = new DashboardPage(await context.newPage())
      await secondTab.goto('/')
      await expectSubtitle(secondTab, 'Hindi')
      await secondTab.page.close()
    })
    await allure.step('Assert: language_state_matches_approved_persistence_scope', async () => {
      // Language is stored per browser profile (localStorage), so a fresh context starts in English.
      const fresh = await browser.newContext()
      try {
        const other = new DashboardPage(await fresh.newPage())
        await other.goto('/')
        await expectSubtitle(other, 'English')
      } finally {
        await fresh.close()
      }
    })
  })

  test('JSD-01-E2: Repeated switching, long translations and keyboard interaction', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-01-E2') }, async ({ page }, testInfo) => {
    await reportMetadata('JSD-01-E2', testInfo)
    const app = new DashboardPage(page)
    await app.goto('/')
    await allure.step('Switch languages repeatedly', async () => {
      for (const language of ['Hindi', 'Assamese', 'English', 'Hindi', 'Assamese'] as Language[]) await app.selectLanguage(language)
    })
    await allure.step('Assert: final_language_matches_final_selection', async () => {
      await expectSubtitle(app, 'Assamese')
      expect(await app.storedLanguage()).toBe('as')
    })
    await allure.step('Inspect long labels and numeral formatting at the agreed viewport', async () => {
      expect(await app.hasHorizontalOverflow()).toBe(false)
      expect(await app.clippedText(app.header())).toEqual([])
      expect(await app.clippedText(app.main())).toEqual([])
      // Numerals stay in Western digits with Indian grouping in every language.
      for (const record of await app.summaryRecords()) {
        for (const value of record.slice(1)) expect(value).toMatch(/^[\d,.]+%?$/)
      }
    })
    await allure.step('Select languages using keyboard controls', async () => {
      await app.languageButton().focus()
      await page.keyboard.press('Enter')
      await expect(app.languageMenu()).toBeVisible()
      await expect(app.languageOption('English')).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(app.languageOption('Hindi')).toBeFocused()
      await page.keyboard.press('Enter')
      await expectSubtitle(app, 'Hindi')
    })
    await allure.step('Assert: keyboard_focus_matches_approved_behavior', async () => {
      await expect(app.languageMenu()).toBeHidden()
      await expect(app.languageButton()).toBeFocused()
    })
  })
})
