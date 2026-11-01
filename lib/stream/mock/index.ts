import type {
  StreamActions,
  StreamDataSource,
  StreamDevControls,
} from "@/lib/stream/dataSource";
import { MockStreamEngine } from "@/lib/stream/mock/engine";
import {
  MockDevControls,
  MockStreamActions,
} from "@/lib/stream/mock/MockStreamActions";
import { MockStreamDataSource } from "@/lib/stream/mock/MockStreamDataSource";
import { SEED_START, seedScenarios } from "@/lib/stream/mock/scenarios";

interface MockStream {
  readonly dataSource: StreamDataSource;
  readonly actions: StreamActions;
  readonly dev: StreamDevControls;
  readonly engine: MockStreamEngine;
}

/**
 * A seeded mock of the whole 6529 Stream protocol. Each call builds an
 * independent world; the UI keeps one per browser tab.
 */
export function createMockStream(
  options: { readonly wallNow?: () => number; readonly seeded?: boolean } = {}
): MockStream {
  const engine = new MockStreamEngine({
    start: SEED_START,
    ...(options.wallNow === undefined ? {} : { wallNow: options.wallNow }),
    ...(options.seeded === false ? {} : { seed: seedScenarios }),
  });
  return {
    dataSource: new MockStreamDataSource(engine),
    actions: new MockStreamActions(engine),
    dev: new MockDevControls(engine),
    engine,
  };
}

export { MOCK_ACCOUNTS } from "@/lib/stream/mock/scenarios";
export { MOCK_EPOCH } from "@/lib/stream/mock/engine";
