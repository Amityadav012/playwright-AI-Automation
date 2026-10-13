/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-07.yaml
 * Flow: JSD-07 - regularity_and_quantity_charts
 * Generator: /script-gen jalsoochak-dashboard JSD-07
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-07.yaml'
export const FLOW_ID = 'JSD-07'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-06', 'OQ-08'],
  reasons: ['Series and tooltip selectors missing', 'Time selectors duplicated', 'Demand and time aggregation rules pending'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-07-H1': { scope_range_pairs: null, regularity_mapping: null, formatting_rules: null },
  'JSD-07-H2': { scope_range_pairs: null, quantity_mapping: null, demand_definition: null },
  'JSD-07-H3': { charts: ['Regularity', 'Quantity'], time_buckets: null, expected_categories: null },
  'JSD-07-E1': { variants: ['empty', 'single', 'many', 'equal_series', 'long_labels'], chart_fixtures: null },
  'JSD-07-E2': { missing_bucket_fixture: null, date_pairs: null, request_patterns: null, aggregation_rules: null },
} as const satisfies FixtureRecord