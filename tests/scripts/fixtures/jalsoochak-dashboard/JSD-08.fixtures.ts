/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-08.yaml
 * Flow: JSD-08 - reading_submission_charts
 * Generator: /script-gen jalsoochak-dashboard JSD-08
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-08.yaml'
export const FLOW_ID = 'JSD-08'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-06', 'OQ-08'],
  reasons: ['Reading-chart elements absent from contract', 'Status and rate denominator and formatting rules pending'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-08-H1': { mixed_status_fixture: null, status_mapping: null, help_definition: null },
  'JSD-08-H2': { rate_fixture: null, expected_category_ids: null, percentage_format: null },
  'JSD-08-H3': { hierarchy_range_pairs: null, status_mapping: null, rate_mapping: null },
  'JSD-08-E1': { variants: ['no_submissions', 'all_compliant', 'all_anomalous', 'missing_denominator'], response_fixtures: null, presentation_rules: null },
  'JSD-08-E2': { variants: ['duplicate_submission', 'rounding_boundary', 'missing_geography_label'], response_fixtures: null, anomaly_rules: null },
} as const satisfies FixtureRecord