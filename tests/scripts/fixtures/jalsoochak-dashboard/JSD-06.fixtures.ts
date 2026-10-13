/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-06.yaml
 * Flow: JSD-06 - performance_summary
 * Generator: /script-gen jalsoochak-dashboard JSD-06
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-06.yaml'
export const FLOW_ID = 'JSD-06'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-06', 'OQ-08'],
  reasons: ['Assam route absent', 'Stable row and scroll selectors missing', 'Sort cycle tie and null rules pending'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-06-H1': { columns: ['Geography', 'Regularity', 'Quantity MLD', 'Quantity LPCD', 'Household'], approved_schema: null },
  'JSD-06-H2': { hierarchy_range_pairs: null, response_mapping: null },
  'JSD-06-H3': { unsorted_records: null, comparator_rules: null, direction_cycle: null },
  'JSD-06-E1': { variants: ['equal_keys', null, 'zero', 'decimal', 'large_grouped_number'], fixtures: null, tie_rules: null },
  'JSD-06-E2': { empty_fixture: null, long_name_records: null, total_identity_set: null, scope_change_rules: null },
} as const satisfies FixtureRecord