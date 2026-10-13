export type FixtureValue =
  | string
  | number
  | boolean
  | null
  | readonly FixtureValue[]
  | { readonly [key: string]: FixtureValue }

export type FixtureRecord = Readonly<Record<string, Readonly<Record<string, FixtureValue>>>>

export interface ReviewGate {
  readonly status: 'blocked'
  readonly questions: readonly string[]
  readonly reasons: readonly string[]
}

export interface SeedContext {
  readonly flowId: string
  readonly mode: 'anonymous_read_only'
  readonly createdRecords: readonly []
}

export class BlockedFlowError extends Error {
  constructor(flowId: string, source: string, gate: ReviewGate) {
    super(`${flowId} is blocked by ${source}: ${gate.reasons.join('; ')}. Review ${gate.questions.join(', ')}.`)
    this.name = 'BlockedFlowError'
  }
}

export function createReadOnlySeed(flowId: string, source: string, gate: ReviewGate) {
  return {
    async seedData(requestedFlowId: string, _request: unknown, _baseUrl: string): Promise<SeedContext> {
      if (requestedFlowId !== flowId) {
        throw new Error(`Expected ${flowId}, received ${requestedFlowId}`)
      }
      throw new BlockedFlowError(flowId, source, gate)
    },

    async teardownData(ctx: SeedContext, _request: unknown, _baseUrl: string): Promise<void> {
      if (ctx.flowId !== flowId || ctx.mode !== 'anonymous_read_only' || ctx.createdRecords.length !== 0) {
        throw new Error(`Refusing teardown for an invalid read-only ${flowId} context`)
      }
    },
  }
}