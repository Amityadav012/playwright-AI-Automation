/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-09.yaml
 * Flow: JSD-09 - footer_and_public_destinations
 * Generator: /script-gen jalsoochak-dashboard JSD-09
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-09.yaml'
export const FLOW_ID = 'JSD-09'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-09', 'OQ-11'],
  reasons: ['Officer-link selectors share href', 'Assam page not captured', 'PHED JJM contact and visitor-count requirements unconfirmed'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-09-H1': { officer_path: '/staff/login', system_path: '/login', glossary_path: '/glossary' },
  'JSD-09-H2': { destination_source: 'data/contracts/jalsoochak-contract.json', mailto: 'mailto:info@arghyam.org' },
  'JSD-09-H3': { phed_required: null, jjm_required: null, approved_destinations: null, contact_reference: null, visitor_rules: null },
  'JSD-09-E1': { base_url: '${QA_BASE_URL}', external_failure_rules: null, tab_rules: null },
  'JSD-09-E2': { keyboard_rules: null, fixed_clock: null, copyright_rule: null, unavailable_visitor_rule: null },
} as const satisfies FixtureRecord