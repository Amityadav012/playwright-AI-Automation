/**
 * AUTO-GENERATED - do not edit by hand.
 * Source: tests/testcases/jalsoochak-dashboard/JSD-01.yaml
 * Flow: JSD-01 - header_and_languages
 * Generator: /script-gen jalsoochak-dashboard JSD-01
 */
import { createReadOnlySeed } from '../../helpers/read-only-seed'
import { FLOW_ID, YAML_SOURCE, reviewGate } from '../jalsoochak-dashboard/JSD-01.fixtures'

export type { SeedContext } from '../../helpers/read-only-seed'

export const { seedData, teardownData } = createReadOnlySeed(FLOW_ID, YAML_SOURCE, reviewGate)