# JalSoochak script-generation handoff

Source: `tests/testcases/jalsoochak-dashboard/JSD-01.yaml` through `JSD-10.yaml`.
Instructions: `.claude/commands/script-gen.md`.

## Analysis

The DSL contains 10 flows and 51 cases: 27 happy-path and 24 edge cases, mapped to all 35 scenario IDs. Every case has `test_type: [e2e]`, every flow has no API endpoints or RBAC checks, and there are no integration triggers or verification blocks. Every flow is review-blocked.

`script-gen` Parts A and B cannot produce meaningful API/integration specs from this source. UI assertion names containing `matches` do not justify inventing a response field, expected status, endpoint, credentials, or database connection. No API/integration specs or passing placeholder tests were created. No Allure report or test execution coverage is claimed.

Parts C and D produced typed fixtures and read-only seed wrappers. The subsequent `playwright-gen` step generated ten E2E spec scaffolds and two contract-backed page objects. All 51 cases are review-blocked with suite-level `test.fixme()` before browser setup. Their unresolved steps/assertions explicitly throw if reached; removing the gate alone does not make these implemented tests.

## Playwright outputs

| Spec | Cases |
|---|---|
| [JSD-01.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-01.e2e.spec.ts) | 4 |
| [JSD-02.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-02.e2e.spec.ts) | 6 |
| [JSD-03.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-03.e2e.spec.ts) | 6 |
| [JSD-04.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-04.e2e.spec.ts) | 5 |
| [JSD-05.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-05.e2e.spec.ts) | 5 |
| [JSD-06.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-06.e2e.spec.ts) | 5 |
| [JSD-07.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-07.e2e.spec.ts) | 5 |
| [JSD-08.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-08.e2e.spec.ts) | 5 |
| [JSD-09.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-09.e2e.spec.ts) | 5 |
| [JSD-10.e2e.spec.ts](e2e/jalsoochak-dashboard/JSD-10.e2e.spec.ts) | 5 |

Page objects: [HomePage.page.ts](pages/HomePage.page.ts) and [GlossaryPage.page.ts](pages/GlossaryPage.page.ts). Contract roles and selectors are preserved, including known audit issues. They do not provide an Assam page object.

Each spec preserves case order, tags, scenario references, fixture attachment code, Allure metadata, planned step text and assertion names. Static annotations identify blocked cases even though body-level Allure calls do not run for them. Anonymous cases require no storage-state file and do not invoke seed scripts.

From this directory:

```powershell
npm run typecheck
npm run test:list
npm run test:e2e
```

The configuration targets Chrome at 1920x1080 and reads `QA_BASE_URL` from the process or local `.env.qa`. Browser installation is unnecessary for the current fully blocked run. Once cases are implemented and approved, install Chrome if needed with `npx playwright install chrome`.

HTML and Allure result files are produced by the runner. Generate a rendered Allure report with `npm run report:generate` and open it with `npm run report:open`; this requires a suitable Java runtime for Allure CLI.

## Files generated

| Flow | Fixture | Seed wrapper |
|---|---|---|
| JSD-01 | [JSD-01.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-01.fixtures.ts) | [JSD-01.seed.ts](fixtures/seeds/JSD-01.seed.ts) |
| JSD-02 | [JSD-02.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-02.fixtures.ts) | [JSD-02.seed.ts](fixtures/seeds/JSD-02.seed.ts) |
| JSD-03 | [JSD-03.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-03.fixtures.ts) | [JSD-03.seed.ts](fixtures/seeds/JSD-03.seed.ts) |
| JSD-04 | [JSD-04.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-04.fixtures.ts) | [JSD-04.seed.ts](fixtures/seeds/JSD-04.seed.ts) |
| JSD-05 | [JSD-05.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-05.fixtures.ts) | [JSD-05.seed.ts](fixtures/seeds/JSD-05.seed.ts) |
| JSD-06 | [JSD-06.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-06.fixtures.ts) | [JSD-06.seed.ts](fixtures/seeds/JSD-06.seed.ts) |
| JSD-07 | [JSD-07.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-07.fixtures.ts) | [JSD-07.seed.ts](fixtures/seeds/JSD-07.seed.ts) |
| JSD-08 | [JSD-08.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-08.fixtures.ts) | [JSD-08.seed.ts](fixtures/seeds/JSD-08.seed.ts) |
| JSD-09 | [JSD-09.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-09.fixtures.ts) | [JSD-09.seed.ts](fixtures/seeds/JSD-09.seed.ts) |
| JSD-10 | [JSD-10.fixtures.ts](fixtures/jalsoochak-dashboard/JSD-10.fixtures.ts) | [JSD-10.seed.ts](fixtures/seeds/JSD-10.seed.ts) |

Shared types and safety logic: [read-only-seed.ts](helpers/read-only-seed.ts).

## Fixture and seed behavior

- Fixture keys and values copy the parsed DSL exactly, including arrays, environment placeholders and unresolved `null` values. Each fixture file exports `FLOW_ID`, `YAML_SOURCE`, `reviewGate`, and `fixtures` with `as const` and type checks.
- A fixture `null` means unresolved input unless its source uses it as an actual null-data variant. In JSD-06-E1, the unquoted YAML `null` variant parses as an actual null value, not the string `"null"`; it is preserved rather than silently normalized.
- `seedData(flowId, request, baseUrl)` rejects with `BlockedFlowError` for the blocked DSL and rejects a mismatched flow ID. It never reads or invokes the request client. Clearing blockers requires deliberate source/implementation revision, not a bypass flag.
- `teardownData(ctx, request, baseUrl)` accepts only a matching anonymous read-only context with no created records; it performs no mutation. Invalid contexts are rejected, not deleted remotely.
- Seed wrappers are not data-creation implementations. The public dashboard scope prohibits seeding; no POST/DELETE/database calls or fictional `qa-test` records are added.
- Fixture constants are snapshots. Reconcile them with the DSL whenever reviewed requirements or data change; do not treat them as independently approved values.

## Unresolved gates

| Flow | Required evidence before executable browser assertions |
|---|---|
| JSD-01 | Canonical route; actual language menu roles; translated samples and persistence/keyboard rules |
| JSD-02 | Start/end disambiguation; fixed clock/timezone; valid bounds; quick-range, Clear and Apply rules |
| JSD-03 | Captured hierarchy/search/mode controls; real parent-child fixtures and dependent reset rules |
| JSD-04 | KPI value/indicator selectors; scoped help controls; formatting and approved UI/response mapping |
| JSD-05 | Correct toggle role; actual map targets/breadcrumbs; geometry fixture and legend definitions |
| JSD-06 | Stable records/scroll container; approved numeric comparator, direction, tie and null rules |
| JSD-07 | Chart-scoped view controls; series/tooltips; approved Demand and time-bucket definitions |
| JSD-08 | Captured reading charts; populated/empty fixtures; separate status/rate denominator rules |
| JSD-09 | Officer link disambiguation; approved missing PHED/JJM/contact/visitor-count requirements |
| JSD-10 | Readiness/error/retry selectors; browser-local request mapping; SLA and fail-versus-blocked policy |

The current contract lacks the Assam `/as` route. National home-page IDs cannot be assumed to describe that route. Zero is not missing data, changing filters need not change numerical values, and table-row navigation does not establish map-click coverage.

## Validation and next step

Strict TypeScript checking passed. All 51 fixture entries and ten review gates were compared with parsed YAML. Seed/teardown checks used a trap request client and made zero network calls. No live dashboard execution was performed during this generation.

Playwright discovery found all 51 cases in ten spec files. The runner reported 51 skipped, zero passed and zero failed because all gates remain blocked. This validates discovery/reporting, not the dashboard or the unresolved assertions.

Resolve the plan's open questions, capture/audit the target route, fill approved fixtures, and implement the guarded steps before clearing review gates. If API/integration coverage is desired instead, supply explicit endpoint contracts, approved assertions, actors and integration verification rules first. Keep `PROCESS.md`, the plan and source DSL unchanged until review decisions are recorded.