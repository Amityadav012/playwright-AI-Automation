# Test plan: jalsoochak-dashboard

<!-- generated from jalsoochak-contract.json | app: JalSoochak -->

Status: Draft for user review. Prepared: 2026-10-09. No execution or approval is claimed by this document.

## Module purpose

Verify the public JalSoochak dashboard's navigation, language controls, date and geography filtering, KPIs, map, summary table, charts, footer, and resilience. Use the workflow in PROCESS.md to turn reviewed flows into YAML cases, audit selectors, and then generate scripts. Check UI behavior and observable consistency only; numerical business correctness requires an approved reference dataset and is not claimed here. Login submission, OTP delivery, data mutation, backend calculation validation, penetration testing, and other browser/mobile matrices are out of scope unless separately approved.

Review baseline: read-only public dashboard, Chrome at 1920x1080, and all languages exposed by its selector. These are the earlier user decisions, not approval of the unanswered business rules below.

---

## Actors

| Actor | Description |
|---|---|
| Public dashboard visitor | Anonymous visitor; no credentials or write actions required for the approved scope. |
| QA reviewer | Approves expected outcomes, fixtures, priorities, and deferred coverage before case generation. |
| Product/data owner | Supplies date/filter semantics, data definitions, tolerances, and error-handling expectations. |

---

## Flows to test

| Flow ID | Description | Priority |
|---|---|---|
| JSD-01 | Header, language choices, translation and persistence; TS-001-002 | P1 |
| JSD-02 | Date ranges, quick ranges, Clear and Apply; TS-003 | P0 |
| JSD-03 | Administrative/Departmental search, hierarchy, switching and reset; TS-004-008 | P0 |
| JSD-04 | KPI presentation, comparisons and filter consistency; TS-009-011 | P0 |
| JSD-05 | Map rendering, fullscreen, metric toggle and hierarchy navigation; TS-012-016 | P0 |
| JSD-06 | Performance Summary formatting, filtering, sorting and scrolling; TS-017-019 | P1 |
| JSD-07 | Regularity and Quantity charts, views and filtering; TS-020-025 | P1 |
| JSD-08 | Reading Submission Status and Rate; TS-026-029 | P1 |
| JSD-09 | Footer navigation, contact details and attribution; TS-030-033 | P1 |
| JSD-10 | Agreed desktop layout, loading, slow and failed requests; TS-034-035 | P1 |

All 35 source scenario IDs are traced above. A traced scenario is not necessarily automation-ready or fully asserted.

---

## Key assertions

- Match navigation with contract `pages[].path`, `elements[].raw_href`, `target_path`, and `opens_new_tab`; distinguish relative URLs, external tabs, and mail links.
- Resolve elements by page and `element_id`, not by ID alone: IDs repeat across contract pages. Copy `selectors.playwright` verbatim and audit uniqueness before use.
- Exclude `stale: true` elements from execution; do not treat a stale selector as evidence of a product failure.
- Require a loaded geographic context and selected date range before checking widget consistency. Equal values before and after a filter change do not prove filtering failed or succeeded.
- Separate zero, missing data, loading, and failed requests. Do not accept any of these as substitutes for another without an approved rule.
- Do not derive expected values from the same displayed value under test. UI/API agreement is consistency evidence, not independent validation of calculations.
- Check labels, units, numerical formatting, and comparison presentation; percentage bounds and rounding remain review questions, not hardcoded rules.
- Reset each case with a fresh browser context and explicit route, language, filters and date range. Observe refresh persistence within a case before resetting it.
- Test only Chrome at 1920x1080 under the current approval. Wider compatibility and responsiveness remain deferred.
- Never send OTPs, log in, submit forms, invoke mail clients, mutate data, or approve screenshot baselines during this planning task.

---

## Per-flow notes

Contract-backed route: `home` at `/`. Review target: https://jalsoochak.beehyv.com/as?tab=administrative. Use `QA_BASE_URL` in generated cases. The contract does not contain `/as`; the home IDs below are evidence for a re-scrape, not proof that selectors apply on the Assam route.

### JSD-01 - Header and languages

**Page:** `home` | **Path:** `/`

Start in a fresh context with an explicitly chosen baseline language. Test each currently available language independently; observe refresh behavior before clearing storage. Header title and logo layout need additional contract capture.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Inspect header home link | jalsoochak_logo_with_text_0 | JalSoochak logo with text | / | href |
| Open language selector | change_language_10 | Change language | / | visible/menu |

**Selectors to use:**
- `jalsoochak_logo_with_text_0`: `page.locator('a[href="/"]')`; audit header/footer duplicates.
- `change_language_10`: `page.getByRole('button', { name: 'Change language', exact: true })`

**Edge cases:**
- Long translations, untranslated labels, numeral formatting, keyboard focus, selected-language indication, repeated switching, refresh and a second tab.
- Do not equate menu closure with translation success. Require an approved translated-label sample for each language.
- Language option selectors need re-audit; earlier observations exposed menu items while the contract records buttons.

### JSD-02 - Dates and quick ranges

**Page:** `home` | **Path:** `/`

Reset to the baseline range between cases. Use explicit timezone and approved date fixtures rather than machine-local "today" for deterministic assertions.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Open date panel | 08_10_2026_11 | Duration | / | visible/dialog |
| Enter start date | dd_mm_yyyy_52 | dd/mm/yyyy | / | input value |
| Enter end date | dd_mm_yyyy_54 | dd/mm/yyyy | / | input value |
| Choose quick range | yesterday_17 | Yesterday | / | selected range; rule pending |
| Apply range | apply_23 | Apply | / | applied state; rule pending |
| Clear range | clear_22 | Clear | / | reset state; rule pending |

**Selectors to use:**
- `08_10_2026_11`: `page.getByRole('button', { name: 'Duration', exact: true })`; ID contains scrape-date text, not an expected current date.
- `dd_mm_yyyy_52`: `page.getByRole('textbox', { name: 'dd/mm/yyyy', exact: true })`
- `dd_mm_yyyy_54`: `page.getByRole('textbox', { name: 'dd/mm/yyyy', exact: true })`; identical selector; start/end association is unresolved.
- `yesterday_17`: `page.getByRole('button', { name: 'Yesterday', exact: true })`
- `apply_23`: `page.getByRole('button', { name: 'Apply', exact: true })`
- `clear_22`: `page.getByRole('button', { name: 'Clear', exact: true })`; disambiguate panel Clear from other Clear controls.

**Edge cases:**
- Same-day range, reversed dates, one/both empty fields, malformed input, impossible date, leap day, month/year rollover, future dates and oldest supported date.
- Quick range then manual edit, Apply twice, Clear before/after Apply, close without Apply, refresh after Apply and request failure while applying.
- Week start, timezone, inclusive boundaries, maximum range and disabled-date behavior all require review.

### JSD-03 - Geography and filter lifecycle

**Page:** `home` | **Path:** `/`

Start from the reviewed unfiltered state; restore it between Administrative and Departmental cases. Hierarchy/search controls and `/as` route are missing from the contract, so detailed interaction steps remain blocked.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Reset dashboard filters | clear_all_filters_24 | Clear all filters | / | reset state; rule pending |

**Selectors to use:**
- `clear_all_filters_24`: `page.getByRole('button', { name: 'Clear all filters', exact: true })`
- Missing controls: `MISSING SELECTOR`; no fabricated State, District, Block, Gram Panchayat, Village, Zone, Circle or search IDs.

**Edge cases:**
- Exact/partial search, case and whitespace, punctuation, Unicode, no match, duplicate names under different parents and nodes with no children.
- Change parent after selecting a child; verify dependent reset only after the intended rule is approved.
- Rapid searches, delayed/out-of-order responses, switch mode with a selected hierarchy, Escape/outside click, clear twice and refresh/back navigation.

### JSD-04 - KPIs and previous-period comparisons

**Page:** `home` | **Path:** `/`

Capture selected scope and dates with every KPI observation. KPI value nodes are absent from the contract; presentation and update assertions need fresh capture. Do not invent expected numerical values.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Inspect KPI help | more_info_12 | More info | / | visible/help; scope pending |

**Selectors to use:**
- `more_info_12`: `page.getByRole('button', { name: 'More info', exact: true })`; repeated across widgets, requires a verified container.
- KPI labels, values, units and comparison indicators: `MISSING SELECTOR` in current contract.

**Edge cases:**
- Zero, missing, negative and unusually large values; previous value zero/missing; equal/up/down comparison; rounding, thousands grouping and unit consistency.
- One widget fails while others load; previous response arrives after a newer filter request; data refresh during observation.
- Never require all values to change on every filter. Nonzero/zero fixtures and independent request context are needed to make that check meaningful.

### JSD-05 - Map and geographic navigation

**Page:** `home` | **Path:** `/`

Restore geographic scope and metric between cases. Map-region selection must be tested through actual map targets; a summary-row click is not equivalent coverage.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Choose district view | district_view_14 | District View | / | selected view |
| Expand map | show_fullscreen_map_15 | Show fullscreen map | / | fullscreen state |
| Change metric | switch_map_metric_currently_selected_regularity_42 | Switch map metric. Currently selected: Regularity | / | selected metric; selector audit required |

**Selectors to use:**
- `district_view_14`: `page.getByRole('button', { name: 'District View', exact: true })`
- `show_fullscreen_map_15`: `page.getByRole('button', { name: 'Show fullscreen map', exact: true })`
- `switch_map_metric_currently_selected_regularity_42`: `page.getByRole('textbox', { name: 'Switch map metric. Currently selected: Regularity', exact: true })`; recorded textbox conflicts with observed checkbox; do not automate until refreshed.
- Map paths, legend, tooltip and breadcrumb controls: `MISSING SELECTOR` in current contract.

**Edge cases:**
- Region without data/children, repeated names, small regions, tooltip overlap, absent geometry, missing map assets, changing scope while fullscreen and Escape/close restoration.
- Drill State to Village and back; compare scope labels across map, summary and charts using an approved hierarchy fixture.
- Legend threshold boundaries and color meaning need approved definitions; screenshot appearance alone does not prove correctness.

### JSD-06 - Performance Summary

**Page:** `home` | **Path:** `/`

Use approved unsorted and tied-value datasets. Preserve and compare complete records before/after sorting; do not mistake visible row count for total records in a virtualized table.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Sort geography | state_ut_16 | State/UT | / | ordered records; direction pending |
| Sort regularity | regularity_17 | Regularity (%) | / | numeric order |
| Sort quantity | quantity_mld_18 | Quantity (MLD) | / | numeric order |
| Sort household | household_20 | Household | / | numeric order |

**Selectors to use:**
- `state_ut_16`: `page.getByRole('button', { name: 'State/UT', exact: true })`
- `regularity_17`: `page.getByRole('button', { name: 'Regularity (%)', exact: true })`
- `quantity_mld_18`: `page.getByRole('button', { name: 'Quantity (MLD)', exact: true })`
- `household_20`: `page.getByRole('button', { name: 'Household', exact: true })`

**Edge cases:**
- Equal keys, nulls, zeros, large values, decimal ordering versus lexicographic ordering, long names, empty table and complete scrolling.
- Preserve row/value association across sort, scope change and scroll. Sort direction cycle and tie-break rules require confirmation.
- Data-bearing row selectors from the scrape embed changing KPI values; do not use them as stable expectations.

### JSD-07 - Regularity and Quantity charts

**Page:** `home` | **Path:** `/`

Reset chart view and filters per case. Scope view controls to the verified chart container; Geography and Time appear in multiple panels.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Open Regularity view control | geography_26 | Geography | / | view menu |
| Open Quantity view control | geography_28 | Geography | / | view menu |
| Select Regularity Time | time_37 | Time | / | time view; scope pending |
| Select Quantity Time | time_41 | Time | / | time view; scope pending |

**Selectors to use:**
- `geography_26`: `page.getByRole('button', { name: 'Regularity performance view by', exact: true })`
- `geography_28`: `page.getByRole('button', { name: 'Quantity performance view by', exact: true })`
- `time_37`: `page.getByRole('button', { name: 'Time', exact: true })`
- `time_41`: `page.getByRole('button', { name: 'Time', exact: true })`; duplicate selector needs chart/menu scoping.
- Series values, Demand definition, axis labels and tooltips: `MISSING SELECTOR` in current contract.

**Edge cases:**
- Empty/single/many categories, missing time buckets, same-valued series, long labels, horizontal scrolling, changing date range in Time view and late responses after switching views.
- Geography ordering, time aggregation, Demand definition, tooltips and unit formatting need reviewed rules.

### JSD-08 - Reading submission charts

**Page:** `home` | **Path:** `/`

Restore baseline context per case. No reading-chart elements are represented in the current contract; do not invent step-table IDs. Capture both populated and no-data states before generating cases.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|

**Selectors to use:**
- Status/rate panels, legends, series, info icons and scroll containers: `MISSING SELECTOR`.

**Edge cases:**
- No submissions, all compliant, all anomalous, mixed statuses, missing denominator, duplicate submissions, percentages near rounding boundaries and missing geographic labels.
- Status and rate may have different denominators; never assert they sum or match without a business rule.

### JSD-09 - Footer and public destinations

**Page:** `home` | **Path:** `/`

Inspect destinations without submitting any login form. Use isolated tabs for approved external navigation; validate mail links without launching a mail client.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|
| Inspect officer link | sub_divisional_officer_login_4 | Sub-Divisional Officer login | /staff/login | href |
| Inspect officer link | section_officer_login_5 | Section Officer login | /staff/login | href |
| Inspect system login link | system_users_login_6 | System Users login | /login | href |
| Open glossary | dashboard_glossary_8 | Dashboard Glossary | /glossary | pathname |
| Inspect website link | jalsoochak_website_7 | JalSoochak website | external | href/new tab |
| Inspect social link | x_twitter_1 | X (Twitter) | external | href/new tab |
| Inspect social link | linkedin_2 | LinkedIn | external | href/new tab |
| Inspect contact link | email_3 | Email | mailto | href |
| Inspect attribution | arghyam_9 | Arghyam | external | href/new tab |

**Selectors to use:**
- `sub_divisional_officer_login_4`: `page.locator('a[href="/staff/login"]')`
- `section_officer_login_5`: `page.locator('a[href="/staff/login"]')`; duplicate href; resolve by verified link label.
- `system_users_login_6`: `page.locator('a[href="/login"]')`
- `dashboard_glossary_8`: `page.locator('a[href="/glossary"]')`
- `jalsoochak_website_7`: `page.locator('a[href="https://jalsoochak.in/"]')`
- `x_twitter_1`: `page.locator('a[href="https://x.com/arghyamindia"]')`
- `linkedin_2`: `page.locator('a[href="https://www.linkedin.com/company/arghyam/"]')`
- `email_3`: `page.locator('a[href="mailto:info@arghyam.org"]')`
- `arghyam_9`: `page.locator('a[href="https://arghyam.org/"]')`

**Edge cases:**
- Relative/absolute destinations, missing/new tabs, external site unavailable, blocked popups, keyboard navigation, contact text versus mail destination, year rollover and unavailable visitor count.
- PHED Assam, JJM Assam and visitor-count requirements are not represented in the contract; ask whether they are required on this build, rather than silently omit them.

### JSD-10 - Layout and resilience

**Page:** `home` | **Path:** `/`

Run at Chrome 1920x1080. Observe loading with a clean context, then simulate failures only through isolated browser interception, never by disrupting the server. Reload and remove interception after each failure case.

| Step | Element ID | Label | Expected pathname | Assert kind |
|---|---|---|---|---|

**Selectors to use:**
- Loader, errors, retry affordance and stable-ready state: `MISSING SELECTOR`.

**Edge cases:**
- Offline, timeout, 4xx/5xx, partial widget failure, malformed/empty response, slow map assets, recovery, repeated retry and changing filters mid-request.
- Decide fail versus blocked when public test data is unavailable; do not hide a known product error behind automatic skipping.
- Check document overflow, clipped labels, tooltips and fullscreen exit at the agreed viewport. Other sizes/browsers need explicit approval.
- Define load start/end, cold/warm cache and repeated-sample method before timing assertions. A test timeout is not a performance SLA.

---

## Open questions

| ID | Open question for review | Affected flows | Current treatment |
|---|---|---|---|
| OQ-01 | Is the canonical target the national `/` page, Assam `/as?tab=administrative`, or both? What hierarchy data should we use? | All | Assam is the earlier target; contract coverage must be extended. |
| OQ-02 | Which translated labels prove each language is applied, and should language persist after refresh, route changes or a new tab? | JSD-01 | Discover available languages; persistence and translation oracle pending. |
| OQ-03 | What are the timezone, valid date bounds, week start, inclusive boundaries, maximum span, and invalid/reversed/empty input behavior? | JSD-02 | Valid start/end selection approved; negative expectations pending. |
| OQ-04 | What does Clear reset, and is editing staged until Apply? Does closing the panel discard changes? | JSD-02-03 | Separate reset actions; do not assume equivalence. |
| OQ-05 | How should changing parents or Administrative/Departmental mode affect children, dates, URL and widget scope? What constitutes a matching/no-result search? | JSD-03 | Expected transitions and fixtures pending. |
| OQ-06 | Which API/request context or fixture can establish cross-widget consistency? What are null, zero, comparison, unit and rounding rules? | JSD-04-08 | No business-number oracle approved. |
| OQ-07 | Which hierarchy path reliably has map geometry and children? How should map selection and drill-up affect other filters? | JSD-05 | Map path/selector capture required. |
| OQ-08 | What are sorting direction/tie/null rules, chart time aggregation and Demand definitions? | JSD-06-08 | No guessed ordering or aggregation expectations. |
| OQ-09 | Must this build contain PHED Assam, JJM Assam, a visitor count and the specified contact details? What are their approved destinations? | JSD-09 | Missing items remain explicit requirement gaps. |
| OQ-10 | What loader, error, retry and partial-success behavior is expected? What load SLA and measurement method apply? | JSD-10 | No invented message or timing threshold. |
| OQ-11 | Which accessibility requirements, additional browsers/viewports and visual baselines are approved? | JSD-01, JSD-10 | Current Chrome desktop scope only; no automatic baseline approval. |
| OQ-12 | Which blocked cases may be deferred, who approves them, and what pass-rate/defect threshold makes this ready for release? | All | Review draft, not release sign-off. |

## Warnings

- Current contract was scraped on 2026-10-08 and has only `home`, `glossary`, `login`, and `staff_login`. No `/as` page or workspace is present under `data/output`; canonical module output is not initialized.
- No referenced element is marked `stale: true` in the inspected contract. Absence of that flag does not prove selector freshness.
- Date fields, repeated More info buttons, Time controls and officer links have duplicate selectors. Map metric role and language-option roles need auditing against the current UI.
- Missing-selector coverage includes the Assam hierarchy, KPI value nodes, map regions/breadcrumbs/legend, reading charts, chart series, loader/retry/error states, and some footer requirements.
- Existing dashboard scripts may overlap these flows. Run `/overlap-analysis jalsoochak-dashboard` after workspace setup; this document does not replace, edit or claim full coverage from those scripts.
- Priorities are proposed for review. Edge cases above are test ideas; unresolved questions are not approved requirements and must not be silently converted into assertions.

## Workflow handoff

1. Review this draft and answer the open-question register. PROCESS.md remains unchanged.
2. Confirm the canonical app/module and initialize `data/output/jalsoochak/workspace.json` through the existing workspace workflow. Add the approved dashboard seed route and re-scrape it.
3. Audit the refreshed contract, preserving actual page/element IDs. Replace missing-selector gaps only with captured evidence, then publish the reviewed module plan at `data/output/jalsoochak/tests/testplan/jalsoochak-dashboard.md`.
4. Run overlap analysis, generate YAML cases, and audit selectors before generating E2E scripts. Verify command source paths: testplan-gen writes `tests/testplan/`, while testcase-gen currently documents `tests/testplans/`.
5. Keep a scenario-to-flow-to-case mapping, approved fixtures, explicit blocked reasons, and positive/negative/boundary cases. Do not invent credentials or use fixture seeding on the public deployment.
6. Run approved scripts, capture trace/screenshots and selected request context, triage failures, and report partial coverage separately from complete scenario validation.

## Review acceptance

- Every TS-001 through TS-035 is mapped to a flow; every case has an approved assertion or an explicit blocker.
- Contract-backed step IDs and selectors are verified on the canonical route; duplicate/stale/missing selectors are resolved or deferred explicitly.
- Fixtures, resets, UI consistency evidence and failure behavior are reproducible without modifying public data.
- Reviewer records answers, exclusions and approval before this draft becomes an executable test-case source.