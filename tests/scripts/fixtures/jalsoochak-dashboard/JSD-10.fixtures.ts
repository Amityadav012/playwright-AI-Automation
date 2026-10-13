/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-10.yaml
 * Flow: JSD-10 - layout_loading_and_resilience
 * Generator: /script-gen jalsoochak-dashboard JSD-10
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-10.yaml'
export const FLOW_ID = 'JSD-10'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-10', 'OQ-11', 'OQ-12'],
  reasons: ['Ready loader error and retry selectors missing', 'Performance SLA and failure states pending', 'Test-data unavailability classification pending'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-10-H1': { browser: 'chrome', viewport: { width: 1920, height: 1080 }, approved_layout: null },
  'JSD-10-H2': { start_milestone: null, end_milestone: null, sample_count: null, aggregation_rule: null, sla_ms: null },
  'JSD-10-E1': { variants: ['slow', 'offline', 'timeout', 'http_4xx', 'http_5xx'], request_patterns: null, expected_states: null },
  'JSD-10-E2': { variants: ['partial_widget_failure', 'malformed_response', 'empty_response', 'slow_map_asset'], response_fixtures: null, state_rules: null },
  'JSD-10-E3': { request_patterns: null, retry_rules: null, latest_context_rule: null, failure_classification: null },
} as const satisfies FixtureRecord