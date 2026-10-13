/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-04.yaml
 * Flow: JSD-04 - kpis_and_previous_period_comparisons
 * Generator: /script-gen jalsoochak-dashboard JSD-04
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-04.yaml'
export const FLOW_ID = 'JSD-04'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-06'],
  reasons: ['KPI value and comparison selectors absent', 'More info selector duplicated', 'Formatting and request-context mapping pending'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-04-H1': { kpis: ['Schemes Supplying Water', 'Quantity in MLD', 'Quantity in LPCD', 'Regularity', 'Critical Schemes'], approved_formatting: null },
  'JSD-04-H2': { comparison_fixtures: null, period_rules: null },
  'JSD-04-H3': { scope_range_pairs: null, response_mapping: null },
  'JSD-04-E1': { variants: ['zero', 'missing', 'negative', 'large', 'previous_zero', 'previous_missing', 'equal', 'increase', 'decrease', 'rounding_boundary'], response_fixtures: null, display_rules: null },
  'JSD-04-E2': { request_patterns: null, delayed_response: null, partial_failure_rules: null },
} as const satisfies FixtureRecord