# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: jalsoochak-dashboard\JSD-01.e2e.spec.ts >> JSD-01 header_and_languages >> JSD-01-H1: Header logo, title and home destination
- Location: tests\scripts\e2e\jalsoochak-dashboard\JSD-01.e2e.spec.ts:59:7

# Error details

```
Error: Unresolved DSL step: Load the agreed route. Requires approved selectors/fixtures and canonical route; JSD-01 blocked: OQ-01, OQ-02, OQ-11; Canonical route not confirmed; Assam page absent from contract; Language options need selector audit
```

# Test source

```ts
  1  | /**
  2  |  * AUTO-GENERATED - do not edit by hand.
  3  |  * Source: testcases/jalsoochak-dashboard/JSD-01.yaml
  4  |  * Flow: JSD-01 - header_and_languages
  5  |  * Contract: jalsoochak-contract.json v1.2.0
  6  |  * Generator: /playwright-gen jalsoochak-dashboard JSD-01
  7  |  */
  8  | import { test, type TestInfo } from '@playwright/test'
  9  | import { allure } from 'allure-playwright'
  10 | import { reviewGate, fixtures } from '../../fixtures/jalsoochak-dashboard/JSD-01.fixtures'
  11 | import { HomePage } from '../../pages/HomePage.page'
  12 | 
  13 | const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-01.yaml'
  14 | const BLOCKING_REASON = `JSD-01 blocked: ${reviewGate.questions.join(', ')}; ${reviewGate.reasons.join('; ')}`
  15 | const caseMetadata = {
  16 |   'JSD-01-H1': { title: 'Header logo, title and home destination', type: 'happy_path', priority: 'P1', tags: ['smoke', 'regression'], scenarioIds: ['TS-001'], coverageNote: 'Header-only scoping prevents footer logo duplication from satisfying the assertion.' },
  17 |   'JSD-01-H2': { title: 'Each available language applies approved translated labels', type: 'happy_path', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-002'], coverageNote: 'A closed language menu alone does not prove translation applied.' },
  18 |   'JSD-01-E1': { title: 'Language persistence across refresh, route change and second tab', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-002'], coverageNote: 'Observes persistence before reset; does not assume all contexts share language state.' },
  19 |   'JSD-01-E2': { title: 'Repeated switching, long translations and keyboard interaction', type: 'edge_case', priority: 'P1', tags: ['regression'], scenarioIds: ['TS-001', 'TS-002'], coverageNote: 'Covers stale language updates and translated layout without creating an unapproved visual baseline.' },
  20 | } as const
  21 | type CaseId = keyof typeof caseMetadata
  22 | 
  23 | function annotations(caseId: CaseId) {
  24 |   return [
  25 |     { type: 'case_id', description: caseId },
  26 |     { type: 'scenario_ids', description: caseMetadata[caseId].scenarioIds.join(', ') },
  27 |     { type: 'source', description: `${YAML_SOURCE}#${caseId}` },
  28 |     { type: 'yaml_source', description: YAML_SOURCE },
  29 |     { type: 'blocking_reason', description: BLOCKING_REASON },
  30 |   ]
  31 | }
  32 | 
  33 | async function reportMetadata(caseId: CaseId, testInfo: TestInfo): Promise<void> {
  34 |   const metadata = caseMetadata[caseId]
  35 |   await allure.tms(caseId, `${YAML_SOURCE}#${caseId}`)
  36 |   await allure.parameter('case_id', caseId)
  37 |   await allure.parameter('flow_id', 'JSD-01')
  38 |   await allure.parameter('module', 'jalsoochak-dashboard')
  39 |   await allure.parameter('type', metadata.type)
  40 |   await allure.parameter('priority', metadata.priority)
  41 |   await allure.parameter('test_data_ref', caseId)
  42 |   await allure.parameter('fixture_ref', `fixtures/jalsoochak-dashboard/JSD-01.fixtures.ts#${caseId}`)
  43 |   await allure.parameter('scenario_ids', metadata.scenarioIds.join(', '))
  44 |   await allure.parameter('yaml_source', YAML_SOURCE)
  45 |   await allure.parameter('source', `${YAML_SOURCE}#${caseId}`)
  46 |   await allure.parameter('blocking_reason', BLOCKING_REASON)
  47 |   await allure.epic('jalsoochak-dashboard')
  48 |   await allure.feature('header_and_languages')
  49 |   await allure.story(metadata.title)
  50 |   await allure.severity('normal')
  51 |   for (const tag of metadata.tags) await allure.tag(tag)
  52 |   await allure.description(`${metadata.coverageNote}\n\nSource: ${YAML_SOURCE}#${caseId}`)
  53 |   await testInfo.attach(`fixture-${caseId}`, { body: JSON.stringify(fixtures[caseId], null, 2), contentType: 'application/json' })
  54 | }
  55 | 
  56 | test.describe('JSD-01 header_and_languages', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@smoke', '@regression'] }, () => {
  57 |   //test.fixme(reviewGate.status === 'blocked', BLOCKING_REASON)
  58 | 
  59 |   test('JSD-01-H1: Header logo, title and home destination', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@smoke', '@regression'], annotation: annotations('JSD-01-H1') }, async ({ page }, testInfo) => {
  60 |     await reportMetadata('JSD-01-H1', testInfo)
  61 |     const home = new HomePage(page)
> 62 |     await allure.step('Load the agreed route', async () => { throw new Error('Unresolved DSL step: Load the agreed route. Requires approved selectors/fixtures and canonical route; ' + BLOCKING_REASON) })
     |                                                                    ^ Error: Unresolved DSL step: Load the agreed route. Requires approved selectors/fixtures and canonical route; JSD-01 blocked: OQ-01, OQ-02, OQ-11; Canonical route not confirmed; Assam page absent from contract; Language options need selector audit
  63 |     await allure.step('Inspect header logo and dashboard title', async () => { throw new Error('Unresolved DSL step: Inspect header logo and dashboard title. Requires approved selectors/fixtures and header design; ' + BLOCKING_REASON) })
  64 |     await allure.step('Inspect the header home link destination', async () => { throw new Error('Unresolved DSL step: Inspect the header home link destination. Requires approved selectors/fixtures and header scoping; ' + BLOCKING_REASON) })
  65 |     await allure.step('Assert: header_elements_visible_and_aligned_to_approved_design', async () => { throw new Error('Unresolved DSL assertion: header_elements_visible_and_aligned_to_approved_design. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  66 |     await allure.step('Assert: home_link_resolves_to_contract_destination', async () => { throw new Error('Unresolved DSL assertion: home_link_resolves_to_contract_destination. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  67 |   })
  68 | 
  69 |   test('JSD-01-H2: Each available language applies approved translated labels', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-01-H2') }, async ({ page }, testInfo) => {
  70 |     await reportMetadata('JSD-01-H2', testInfo)
  71 |     const home = new HomePage(page)
  72 |     await allure.step('Discover all available language options', async () => { throw new Error('Unresolved DSL step: Discover all available language options. Requires approved selectors/fixtures and language option audit; ' + BLOCKING_REASON) })
  73 |     await allure.step('Select each option in an isolated context', async () => { throw new Error('Unresolved DSL step: Select each option in an isolated context. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  74 |     await allure.step('Compare approved translated labels and selected-language indication', async () => { throw new Error('Unresolved DSL step: Compare approved translated labels and selected-language indication. Requires approved selectors/fixtures and translated samples; ' + BLOCKING_REASON) })
  75 |     await allure.step('Assert: every_available_language_selectable', async () => { throw new Error('Unresolved DSL assertion: every_available_language_selectable. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  76 |     await allure.step('Assert: displayed_translation_matches_approved_samples', async () => { throw new Error('Unresolved DSL assertion: displayed_translation_matches_approved_samples. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  77 |   })
  78 | 
  79 |   test('JSD-01-E1: Language persistence across refresh, route change and second tab', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-01-E1') }, async ({ page }, testInfo) => {
  80 |     await reportMetadata('JSD-01-E1', testInfo)
  81 |     const home = new HomePage(page)
  82 |     await allure.step('Select a non-baseline available language', async () => { throw new Error('Unresolved DSL step: Select a non-baseline available language. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  83 |     await allure.step('Refresh within the same context', async () => { throw new Error('Unresolved DSL step: Refresh within the same context. Requires approved selectors/fixtures and persistence rules; ' + BLOCKING_REASON) })
  84 |     await allure.step('Navigate to an approved public route and open a second tab', async () => { throw new Error('Unresolved DSL step: Navigate to an approved public route and open a second tab. Requires approved selectors/fixtures and route; ' + BLOCKING_REASON) })
  85 |     await allure.step('Assert: language_state_matches_approved_persistence_scope', async () => { throw new Error('Unresolved DSL assertion: language_state_matches_approved_persistence_scope. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  86 |   })
  87 | 
  88 |   test('JSD-01-E2: Repeated switching, long translations and keyboard interaction', { tag: ['@JSD-01', '@jalsoochak-dashboard', '@P1', '@regression'], annotation: annotations('JSD-01-E2') }, async ({ page }, testInfo) => {
  89 |     await reportMetadata('JSD-01-E2', testInfo)
  90 |     const home = new HomePage(page)
  91 |     await allure.step('Switch languages repeatedly', async () => { throw new Error('Unresolved DSL step: Switch languages repeatedly. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  92 |     await allure.step('Select languages using keyboard controls', async () => { throw new Error('Unresolved DSL step: Select languages using keyboard controls. Requires approved selectors/fixtures and keyboard rules; ' + BLOCKING_REASON) })
  93 |     await allure.step('Inspect long labels and numeral formatting at the agreed viewport', async () => { throw new Error('Unresolved DSL step: Inspect long labels and numeral formatting at the agreed viewport. Requires approved selectors/fixtures and numeral rules; ' + BLOCKING_REASON) })
  94 |     await allure.step('Assert: final_language_matches_final_selection', async () => { throw new Error('Unresolved DSL assertion: final_language_matches_final_selection. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  95 |     await allure.step('Assert: translations_do_not_clip_or_overlap', async () => { throw new Error('Unresolved DSL assertion: translations_do_not_clip_or_overlap. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  96 |     await allure.step('Assert: keyboard_focus_matches_approved_behavior', async () => { throw new Error('Unresolved DSL assertion: keyboard_focus_matches_approved_behavior. Requires approved selectors/fixtures; ' + BLOCKING_REASON) })
  97 |   })
  98 | })
```