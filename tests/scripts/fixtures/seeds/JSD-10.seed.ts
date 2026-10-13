/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-10.yaml
 * Flow: JSD-10 - layout_loading_and_resilience
 * Generator: /script-gen jalsoochak-dashboard JSD-10
 */
import { createReadOnlySeed } from '../../helpers/read-only-seed'
import { FLOW_ID, YAML_SOURCE, reviewGate } from '../jalsoochak-dashboard/JSD-10.fixtures'

export type { SeedContext } from '../../helpers/read-only-seed'

export const { seedData, teardownData } = createReadOnlySeed(FLOW_ID, YAML_SOURCE, reviewGate)