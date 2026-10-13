/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-02.yaml
 * Flow: JSD-02 - dates_and_quick_ranges
 * Generator: /script-gen jalsoochak-dashboard JSD-02
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-02.yaml'
export const FLOW_ID = 'JSD-02'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-03', 'OQ-04'],
  reasons: ['Canonical route needs capture', 'Start and end selectors are identical', 'Date bounds and reset rules unapproved'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-02-H1': { valid_date_pairs: null, timezone: null, request_context_mapping: null },
  'JSD-02-H2': { quick_ranges: 'discover_from_panel', fixed_clock: null, timezone: null, week_start: null, expected_ranges: null },
  'JSD-02-E1': { variants: ['reversed', 'start_empty', 'end_empty', 'both_empty', 'malformed', 'impossible_calendar_date'], expected_rules: null },
  'JSD-02-E2': { variants: ['same_day', 'leap_day', 'month_rollover', 'year_rollover', 'future', 'oldest_supported', 'before_oldest', 'maximum_span', 'beyond_maximum_span'], approved_dates: null, limits: null },
  'JSD-02-E3': { baseline_range: null, clear_rule: null, close_rule: null, refresh_rule: null },
  'JSD-02-E4': { valid_range: null, request_pattern: null, failure_outcome: null },
} as const satisfies FixtureRecord