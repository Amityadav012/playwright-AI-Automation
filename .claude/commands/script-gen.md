Generate API spec, integration spec, fixture stubs, and seed script from a YAML test case file. Usage: /script-gen <module> <FLOW-ID>

Read tests/testcases/$ARGUMENTS.yaml.

PART A — API spec:
Write tests/scripts/api/{module}/{FLOW-ID}.api.spec.ts

Structure per test:
  test('{FLOW-ID}-{id}: {description}', async ({ request }) => {
    // ARRANGE
    const payload = fixtures['{case-id}'].payload;

    // ACT
    const response = await request.{METHOD}(`${BASE_URL}{path}`,
      { data: payload, headers: authHeader });

    // ASSERT
    expect(response.status()).toBe({expected});
    // map assertions from YAML to expect() calls
  });

Assertion mapping (apply these exact translations):
  *_rejected / *_not_allowed  → expect(response.status()).toBe(4xx)
  *_returns_correct_*         → expect(body.field).toBe(expected)
  *_exists / *_created        → expect(body.id).toBeDefined()
  *_matches_*                 → expect(body.field).toEqual(expected)
  unknown assertion           → // TODO: assert {name}

Include:
  - test.use({ storageState }) per actor
  - One test per happy_path, per edge_case, per rbac_check
  - Tags: @{FLOW-ID} @{module} @{priority} @smoke/@regression
  - AUTO-GENERATED header
  - Never hardcode credentials
  - Never use test.only() or test.skip()

PART B — Integration spec (if cases with test_type: integration exist):
Write tests/scripts/integration/{module}/{FLOW-ID}.int.spec.ts

For each integration case:
  - Import { dbs, redis, kafka } from '../../helpers/connections'
  - Fire the trigger action via request.{METHOD}()
  - For each verify block in YAML:
      postgres: await dbs['{service}'].query(query, [resourceId])
      redis:    await redis.get(key)
      kafka:    consumer = await kafka.consumer(); await consumer.subscribe({topic})
               message = await waitForMessage(consumer, 5000)
  - Assert each field as specified in the verify.assert block
  - Tag: @{FLOW-ID} @integration @{priority}

PART C — Fixture stubs:
Write tests/scripts/fixtures/{module}/{FLOW-ID}.fixtures.ts
with typed placeholder objects for each case id.
Use const assertions (as const) for type safety.

PART D — Seed script:
Write tests/scripts/fixtures/seeds/{FLOW-ID}.seed.ts with:
  export async function seedData(flowId, request, baseUrl): SeedContext
  export async function teardownData(ctx, request, baseUrl): void
Use API calls (request.post) for most seeding.
Use dbs['{service}'].query() only for state impossible via API
(expired timestamps, zero-balance edge cases etc).
All seeded records must have name/key prefixed with qa-test-{runId}.

List all files written at the end.
