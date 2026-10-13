/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-01.yaml
 * Flow: JSD-01 - header_and_languages
 * Generator: /script-gen jalsoochak-dashboard JSD-01
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-01.yaml'
export const FLOW_ID = 'JSD-01'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-02', 'OQ-11'],
  reasons: ['Canonical route not confirmed', 'Assam page absent from contract', 'Language options need selector audit'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-01-H1': { route: null, approved_header_design: null },
  'JSD-01-H2': { languages: 'discover_from_selector', approved_translated_samples: null },
  'JSD-01-E1': { language: 'select_available_non_baseline', persistence_rules: null },
  'JSD-01-E2': { language_sequence: 'all_available_then_baseline', keyboard_rules: null, numeral_rules: null },
} as const satisfies FixtureRecord