/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-05.yaml
 * Flow: JSD-05 - map_and_geographic_navigation
 * Generator: /script-gen jalsoochak-dashboard JSD-05
 */
import type { FixtureRecord, ReviewGate } from '../../helpers/read-only-seed'

export const YAML_SOURCE = 'testcases/jalsoochak-dashboard/JSD-05.yaml'
export const FLOW_ID = 'JSD-05'

export const reviewGate = {
  status: 'blocked',
  questions: ['OQ-01', 'OQ-06', 'OQ-07', 'OQ-10'],
  reasons: ['Map metric recorded as textbox instead of checkbox', 'Regions legends and breadcrumbs absent', 'Hierarchy and legend definitions pending'],
} as const satisfies ReviewGate

export const fixtures = {
  'JSD-05-H1': { geographic_fixture: null, legend_definition: null, design_reference: null },
  'JSD-05-H2': { hierarchy_path: null, expected_scope_labels: null },
  'JSD-05-H3': { metrics: ['Quantity', 'Regularity'], filter_pairs: null, response_mapping: null },
  'JSD-05-E1': { variants: ['no_data', 'no_children', 'duplicate_name', 'small_region', 'missing_geometry'], approved_fixtures: null },
  'JSD-05-E2': { threshold_boundary_fixtures: null, fullscreen_rules: null, asset_pattern: null, recovery_rule: null },
} as const satisfies FixtureRecord