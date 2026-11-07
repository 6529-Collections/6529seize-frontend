import type { Hex } from "viem";

import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  addTransitionObserver,
  createActionState,
  setIllegalTransitionReporter,
  step,
  transition,
  type ActionTransition,
  type IllegalTransition,
} from "@/lib/action-lifecycle";
import { ChatStore } from "@/lib/chat-store";

const TX = `0x${"ab".repeat(32)}` as Hex;
const SUBMIT_UNSIGNED = { type: "SUBMIT", requiresSignature: false } as const;

let removals: (() => void)[] = [];
let reports: IllegalTransition[] = [];
let restoreReporter: () => void = () => undefined;

function observe(): ActionTransition[] {
  const seen: ActionTransition[] = [];
  removals.push(addTransitionObserver((transition) => seen.push(transition)));
  return seen;
}

beforeEach(() => {
  reports = [];
  restoreReporter = setIllegalTransitionReporter((report) =>
    reports.push(report)
  );
});

afterEach(() => {
  removals.forEach((remove) => remove());
  removals = [];
  restoreReporter();
});

describe("transition observers", () => {
  it("tells every subscriber about a legal move", () => {
    const first = observe();
    const second = observe();
    transition(createActionState("server"), SUBMIT_UNSIGNED);
    const expected: ActionTransition = {
      from: "draft",
      event: "SUBMIT",
      to: "sending",
      mode: "server",
      legal: true,
    };
    expect(first).toEqual([expected]);
    expect(second).toEqual([expected]);
  });

  it("observes illegal attempts with to === from and legal: false", () => {
    const seen = observe();
    const draft = createActionState("server");
    expect(transition(draft, { type: "SEND_OK" })).toBe(draft);
    expect(seen).toEqual([
      {
        from: "draft",
        event: "SEND_OK",
        to: "draft",
        mode: "server",
        legal: false,
      },
    ]);
    // The reporter still hears about it.
    expect(reports).toEqual([
      { from: "draft", mode: "server", event: "SEND_OK" },
    ]);
  });

  it("stops after unsubscribe, and unsubscribing twice is harmless", () => {
    const seen: ActionTransition[] = [];
    const record = (t: ActionTransition) => seen.push(t);
    const removeFirst = addTransitionObserver(record);
    const removeSecond = addTransitionObserver(record);
    removals.push(removeSecond);
    transition(createActionState("server"), SUBMIT_UNSIGNED);
    // The same function registered twice is told twice.
    expect(seen).toHaveLength(2);
    removeFirst();
    removeFirst();
    transition(createActionState("server"), SUBMIT_UNSIGNED);
    expect(seen).toHaveLength(3);
    removeSecond();
    transition(createActionState("server"), SUBMIT_UNSIGNED);
    expect(seen).toHaveLength(3);
  });

  it("keeps a throwing observer from breaking the caller or the others", () => {
    removals.push(
      addTransitionObserver(() => {
        throw new Error("observer failed");
      })
    );
    const seen = observe();
    expect(transition(createActionState("server"), SUBMIT_UNSIGNED)).toEqual(
      expect.objectContaining({ kind: "sending" })
    );
    expect(seen).toHaveLength(1);
  });

  it("lets an observer unsubscribe while it is being told", () => {
    const seen: ActionTransition[] = [];
    let remove: () => void = () => undefined;
    remove = addTransitionObserver((t) => {
      seen.push(t);
      remove();
    });
    const other = observe();
    transition(createActionState("server"), SUBMIT_UNSIGNED);
    transition(createActionState("server"), SUBMIT_UNSIGNED);
    expect(seen).toHaveLength(1);
    expect(other).toHaveLength(2);
  });

  it("carries kinds and types only: no payloads, IDs, errors or reasons", () => {
    const seen = observe();
    let chain = transition(createActionState("chain"), {
      type: "SUBMIT",
      requiresSignature: true,
    });
    chain = transition(chain, { type: "WALLET_SIGNED", txId: TX });
    chain = transition(chain, { type: "SEND" });
    transition(chain, {
      type: "SEND_ERROR",
      retryable: false,
      at: 123,
      error: "secret error detail",
    });
    const sending = transition(createActionState("server"), SUBMIT_UNSIGNED);
    transition(sending, { type: "REJECTED", reason: "private reason" });

    expect(seen).toHaveLength(6);
    for (const observed of seen) {
      expect(Object.keys(observed).sort()).toEqual([
        "event",
        "from",
        "legal",
        "mode",
        "to",
      ]);
      expect(Object.isFrozen(observed)).toBe(true);
    }
    const serialized = JSON.stringify(seen);
    for (const secret of [TX, "secret error detail", "private reason", "123"]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("is not called by the pure step()", () => {
    const seen = observe();
    step(createActionState("server"), SUBMIT_UNSIGNED);
    expect(seen).toEqual([]);
  });

  it("adds a per-call observer to the app-wide ones", () => {
    const global = observe();
    const scoped: ActionTransition[] = [];
    transition(createActionState("server"), SUBMIT_UNSIGNED, {
      observer: (t) => scoped.push(t),
    });
    expect(scoped).toHaveLength(1);
    expect(global).toHaveLength(1);
  });
});

describe("chat store transition observer", () => {
  const drop = (id: string, serialNo: number, createdAt: number) =>
    ({
      id,
      serial_no: serialNo,
      created_at: createdAt,
      updated_at: null,
      wave: { id: "wave-1" },
      author: { id: "author-1", handle: "alice", is_anonymous: false },
      title: null,
      parts: [{ content: "gm" }],
      metadata: [],
      type: DropSize.FULL,
      stableKey: id,
      stableHash: id,
    }) as unknown as ExtendedDrop;

  it("observes a pending send from sending to posted", () => {
    const scoped: ActionTransition[] = [];
    const store = new ChatStore({ transitionObserver: (t) => scoped.push(t) });
    store.merge("wave-1", [drop("temp-1", 9_000_000, 9_000_000)]);
    store.merge("wave-1", [drop("server-1", 10, 9_000_100)]);
    expect(scoped).toEqual([
      {
        from: "draft",
        event: "SUBMIT",
        to: "sending",
        mode: "server",
        legal: true,
      },
      {
        from: "sending",
        event: "SEND_OK",
        to: "submitted",
        mode: "server",
        legal: true,
      },
    ]);
  });
});
