/**
 * @jest-environment node
 *
 * 8.3 stall clocks in the outbox flush (real controller and stall helpers;
 * sends and empty commit passes stubbed): a failing send owns `stallSince`
 * through `sendFailingSince`, so the empty commits between attempts cannot
 * restart it, and a send that goes through clears both.
 */
import type { EngineContext } from "@/lib/e2ee/engine/context";
import { EngineController } from "@/lib/e2ee/engine/controller";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import * as maintenance from "@/lib/e2ee/engine/maintenance";
import { sendNext } from "@/lib/e2ee/engine/send";
import type { GroupRuntime } from "@/lib/e2ee/engine/store";
import type { StoredGroup, StoredOutboxItem } from "@/lib/e2ee/records";

jest.mock("@/lib/e2ee/engine/send", () => ({ sendNext: jest.fn() }));
jest.mock("@/lib/e2ee/engine/maintenance", () => ({
  ...jest.requireActual("@/lib/e2ee/engine/maintenance"),
  runGroupCommit: jest.fn(),
  requiredChangesPlanner: jest.fn(),
}));

interface Clocks {
  stallSince: number | null;
  sendFailingSince: number | null;
  delayed: boolean;
}

const clocksOf = (runtime: GroupRuntime): Clocks => ({
  stallSince: runtime.stallSince,
  sendFailingSince: runtime.sendFailingSince,
  delayed: runtime.record.delayed,
});

function setup() {
  const start = 1_000_000;
  let now = start;
  const runtime = newRuntime({
    g: "g",
    status: "active",
    delayed: false,
  } as StoredGroup);
  runtime.outbox.set("m1", { id: "m1", g: "g" } as StoredOutboxItem);
  const arm = jest.fn();
  const ctx = {
    disposed: false,
    mls: {},
    now: () => now,
    store: {
      status: "ready",
      groups: new Map([["g", runtime]]),
      touch: jest.fn(),
    },
    queue: { run: <T>(task: () => Promise<T>) => task() },
    tasks: { track: <T>(promise: Promise<T>) => promise },
    // Virtual time: a timer moves the clock to its due time and fires on the
    // next macrotask, so a runaway loop still lets Jest time out.
    scheduler: {
      setTimeout: (fire: () => void, ms: number) => {
        now += ms;
        setImmediate(fire);
        return { id: 0 };
      },
      clearTimeout: () => undefined,
    },
    timers: { arm },
  } as unknown as EngineContext;
  const commits: Clocks[] = [];
  // The real empty-commit path: clear the stall, report nothing committed.
  jest
    .mocked(maintenance.runGroupCommit)
    .mockImplementation(async (context, g) => {
      const current = context.store.groups.get(g)!;
      maintenance.clearStallFor(context, current);
      commits.push(clocksOf(current));
      return { kind: "done", seq: null };
    });
  const controller = new EngineController(ctx, {
    refreshMe: async () => undefined,
    onOwnRevoked: async () => undefined,
    afterSync: async () => undefined,
  });
  return { controller, runtime, commits, arm, start, now: () => now };
}

describe("E2EE engine: send stall clocks", () => {
  beforeEach(() => {
    jest.mocked(sendNext).mockReset();
  });

  it("keeps the clock running across empty commits until the 20 s rule trips", async () => {
    const { controller, runtime, commits, arm, start, now } = setup();
    jest.mocked(sendNext).mockResolvedValue("failed");

    await controller.flush("g");

    // Failed sends at +0, +250, +750 ... +17 750, +22 750 ms: the first one
    // past 20 s marks the group delayed and hands over to the armed retry.
    expect(now() - start).toBe(22_750);
    expect(jest.mocked(sendNext)).toHaveBeenCalledTimes(9);
    expect(commits[0]).toEqual({
      stallSince: null,
      sendFailingSince: null,
      delayed: false,
    });
    // Every empty commit after the first failure kept the first failure time.
    const later = commits.slice(1);
    expect(later).toHaveLength(8);
    expect(later.map((c) => [c.stallSince, c.sendFailingSince])).toEqual(
      later.map(() => [start, start])
    );
    expect(clocksOf(runtime)).toEqual({
      stallSince: start,
      sendFailingSince: start,
      delayed: true,
    });
    expect(arm).toHaveBeenCalledTimes(1);
    expect(arm).toHaveBeenCalledWith("retry:g", 5_000, expect.any(Function));
  });

  it("clears both clocks and the delayed flag when a send goes through", async () => {
    const { controller, runtime, commits, start } = setup();
    jest.mocked(sendNext).mockResolvedValue("failed");
    await controller.flush("g");
    expect(runtime.record.delayed).toBe(true);

    jest.mocked(sendNext).mockImplementation(async (_ctx, current) => {
      current.outbox.clear();
      return "sent";
    });
    await controller.flush("g"); // What the armed retry runs.

    // The empty commit before the send kept the stall the failing send owns.
    expect(commits.at(-1)).toEqual({
      stallSince: start,
      sendFailingSince: start,
      delayed: true,
    });
    expect(clocksOf(runtime)).toEqual({
      stallSince: null,
      sendFailingSince: null,
      delayed: false,
    });
  });
});
