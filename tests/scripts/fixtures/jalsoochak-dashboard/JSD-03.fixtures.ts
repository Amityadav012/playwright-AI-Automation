/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-03.yaml
 * Flow: JSD-03 - geography_and_filter_lifecycle
 * Generator: /script-gen jalsoochak-dashboard JSD-03
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-03.yaml'
export const FLOW_ID = 'JSD-03'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-04', 'OQ-05'],
  reasons: ['Assam hierarchy and search selectors missing', 'Hierarchy fixtures and dependent resets unapproved'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-03-H1': { administrative_path: null },
  'JSD-03-H2': { departmental_path: null },
  'JSD-03-H3': { exact_queries: null, partial_queries: null, expected_result_ids: null },
  'JSD-03-E1': { variants: ['no_match', 'empty', 'whitespace', 'mixed_case', 'punctuation', 'unicode', 'duplicate_name'], expected_results: null },
  'JSD-03-E2': { alternate_parent: null, mode_transition_rules: null, clear_close_rules: null },
  'JSD-03-E3': { queries: null, request_patterns: null, leaf_node: null, approved_latest_query_rule: null },
} as const satisfies FixtureRecord