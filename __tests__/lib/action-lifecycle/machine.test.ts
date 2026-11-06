import type { Hex } from "viem";

import {
  CHAIN_LABEL_RANK,
  actionLabel,
  createActionState,
  isTerminalActionState,
  nextRetryAt,
  setIllegalTransitionReporter,
  step,
  transition,
  type ActionEvent,
  type ActionMode,
  type ActionState,
  type ActionStateKind,
  type IllegalTransition,
} from "@/lib/action-lifecycle";
import {
  deriveChainStatus,
  initialEvidence,
  type GatewayRef,
  type LadderEvidence,
} from "@/lib/chain/status-ladder";

const TX = `0x${"ab".repeat(32)}` as Hex;
const GW1: GatewayRef = { id: "gw-1", operator: "op-a" };
const GW2: GatewayRef = { id: "gw-2", operator: "op-b" };
const GW3: GatewayRef = { id: "gw-3", operator: "op-c" };
const REFUSAL = 0x0101;
const HANDLER_FAILURE = 0x1001;
const DECISION_REF = {
  decisionId: `0x${"cd".repeat(32)}` as Hex,
  decisionTimeMs: 1_000n,
};

const EVENTS = {
  SUBMIT_UNSIGNED: { type: "SUBMIT", requiresSignature: false },
  SUBMIT_SIGNED: { type: "SUBMIT", requiresSignature: true },
  WALLET_SIGNED: { type: "WALLET_SIGNED" },
  WALLET_SIGNED_TX: { type: "WALLET_SIGNED", txId: TX },
  WALLET_REJECTED: { type: "WALLET_REJECTED" },
  SEND: { type: "SEND" },
  OFFLINE: { type: "OFFLINE" },
  SEND_OK: { type: "SEND_OK" },
  SEND_ERROR_RETRYABLE: { type: "SEND_ERROR", retryable: true, at: 10_000 },
  SEND_ERROR_FATAL: {
    type: "SEND_ERROR",
    retryable: false,
    at: 10_000,
    error: "bad request",
  },
  RETRY: { type: "RETRY" },
  CANCEL: { type: "CANCEL" },
  REJECTED: { type: "REJECTED", reason: "moderation" },
  TIMEOUT: { type: "TIMEOUT", at: 10_000 },
  GATEWAY_ACK_OK: { type: "GATEWAY_ACK", gateway: GW1, code: 0 },
  GATEWAY_ACK_REFUSED: { type: "GATEWAY_ACK", gateway: GW1, code: REFUSAL },
  INCLUSION_CLAIM: {
    type: "INCLUSION",
    gateway: GW1,
    height: 10n,
    index: 0,
    code: 0,
  },
  INCLUSION_VERIFIED: { type: "INCLUSION", height: 10n, index: 0 },
  FINALITY_OK: { type: "FINALITY", height: 10n, index: 0, code: 0 },
  DECISION: { type: "DECISION", decision: DECISION_REF },
  EXPIRED: { type: "EXPIRED" },
  REPLACED: { type: "REPLACED" },
  REDUCED: { type: "REDUCED", amount: 5n },
} satisfies Record<string, ActionEvent>;

type EventName = keyof typeof EVENTS;
const EVENT_NAMES = Object.keys(EVENTS) as EventName[];

function progress(evidence: LadderEvidence) {
  return { evidence, status: deriveChainStatus(evidence) };
}

const ACKED: LadderEvidence = {
  ...initialEvidence(TX),
  submissions: { [GW1.id]: { operator: GW1.operator, code: 0 } },
};
const CLAIMED: LadderEvidence = {
  ...ACKED,
  inclusionClaims: {
    [GW1.id]: { operator: GW1.operator, height: 10n, index: 0, code: 0 },
  },
};
const RESULT: LadderEvidence = {
  ...CLAIMED,
  verifiedInclusion: { height: 10n, index: 0 },
  verifiedResult: { height: 10n, index: 0, code: 0 },
};
const DECIDED: LadderEvidence = { ...RESULT, verifiedDecision: DECISION_REF };
const REDUCED_EVIDENCE: LadderEvidence = { ...CLAIMED, reducedTo: 5n };
const REFUSED: LadderEvidence = {
  ...initialEvidence(TX),
  submissions: { [GW1.id]: { operator: GW1.operator, code: REFUSAL } },
};
/** One gateway reports a handler failure: a claim, not yet verified. */
const FAILURE_CLAIMED: LadderEvidence = {
  ...ACKED,
  inclusionClaims: {
    [GW1.id]: {
      operator: GW1.operator,
      height: 10n,
      index: 0,
      code: HANDLER_FAILURE,
    },
  },
};
const REPLACED_VERIFIED: LadderEvidence = {
  ...ACKED,
  verifiedDrop: "replaced",
};

const SERVER_STATES: Record<string, ActionState> = {
  draft: { kind: "draft", mode: "server" },
  "awaiting-signature": { kind: "awaiting-signature", mode: "server" },
  signed: { kind: "signed", mode: "server", attempt: 0, evidence: null },
  queued: { kind: "queued", mode: "server", attempt: 1, evidence: null },
  sending: { kind: "sending", mode: "server", attempt: 1, evidence: null },
  submitted: { kind: "submitted", mode: "server", attempt: 1, chain: null },
  "signature-rejected": {
    kind: "signature-rejected",
    mode: "server",
    reason: "wallet",
  },
  "send-failed": {
    kind: "send-failed",
    mode: "server",
    attempt: 1,
    evidence: null,
    retryable: true,
    nextRetryAt: 11_000,
    error: null,
  },
  rejected: { kind: "rejected", mode: "server", reason: null, chain: null },
  failed: { kind: "failed", mode: "server", reason: null, chain: null },
  expired: { kind: "expired", mode: "server", chain: null },
  cancelled: { kind: "cancelled", mode: "server" },
};

const CHAIN_STATES: Record<string, ActionState> = {
  draft: { kind: "draft", mode: "chain" },
  "awaiting-signature": { kind: "awaiting-signature", mode: "chain" },
  signed: {
    kind: "signed",
    mode: "chain",
    attempt: 0,
    evidence: initialEvidence(TX),
  },
  queued: {
    kind: "queued",
    mode: "chain",
    attempt: 1,
    evidence: initialEvidence(TX),
  },
  sending: {
    kind: "sending",
    mode: "chain",
    attempt: 1,
    evidence: initialEvidence(TX),
  },
  submitted: {
    kind: "submitted",
    mode: "chain",
    attempt: 1,
    chain: progress(ACKED),
  },
  committed: {
    kind: "committed",
    mode: "chain",
    attempt: 1,
    chain: progress(CLAIMED),
  },
  finalized: {
    kind: "finalized",
    mode: "chain",
    attempt: 1,
    chain: progress(RESULT),
  },
  "in-decision": {
    kind: "in-decision",
    mode: "chain",
    attempt: 1,
    chain: progress(DECIDED),
  },
  reduced: {
    kind: "reduced",
    mode: "chain",
    attempt: 1,
    chain: progress(REDUCED_EVIDENCE),
  },
  "signature-rejected": {
    kind: "signature-rejected",
    mode: "chain",
    reason: "wallet",
  },
  "send-failed": {
    kind: "send-failed",
    mode: "chain",
    attempt: 1,
    evidence: initialEvidence(TX),
    retryable: true,
    nextRetryAt: 11_000,
    error: null,
  },
  rejected: {
    kind: "rejected",
    mode: "chain",
    reason: null,
    chain: progress(REFUSED),
  },
  failed: { kind: "failed", mode: "chain", reason: null, chain: null },
  "failed (claimed)": {
    kind: "failed",
    mode: "chain",
    reason: null,
    chain: progress(FAILURE_CLAIMED),
  },
  expired: { kind: "expired", mode: "chain", chain: null },
  replaced: {
    kind: "replaced",
    mode: "chain",
    chain: progress(REPLACED_VERIFIED),
  },
  cancelled: { kind: "cancelled", mode: "chain" },
};

/**
 * The expected table, written out independently of the implementation.
 * A kind: a legal move to that kind. "same": a legal no-op returning the
 * input state. Anything not listed: illegal (input state, reported).
 */
type Expected = ActionStateKind | "same";
type Table = Record<string, Partial<Record<EventName, Expected>>>;

const SERVER_TABLE: Table = {
  draft: {
    SUBMIT_UNSIGNED: "sending",
    SUBMIT_SIGNED: "awaiting-signature",
    CANCEL: "cancelled",
  },
  "awaiting-signature": {
    WALLET_SIGNED: "signed",
    WALLET_SIGNED_TX: "signed",
    WALLET_REJECTED: "signature-rejected",
    TIMEOUT: "signature-rejected",
    CANCEL: "cancelled",
  },
  signed: { SEND: "sending", OFFLINE: "queued", CANCEL: "cancelled" },
  queued: {
    SEND: "sending",
    OFFLINE: "same",
    CANCEL: "cancelled",
    TIMEOUT: "expired",
    SEND_OK: "submitted",
  },
  sending: {
    SEND_OK: "submitted",
    SEND_ERROR_RETRYABLE: "send-failed",
    SEND_ERROR_FATAL: "failed",
    REJECTED: "rejected",
    TIMEOUT: "send-failed",
    OFFLINE: "queued",
  },
  submitted: { SEND_OK: "same" },
  "signature-rejected": { RETRY: "awaiting-signature", CANCEL: "cancelled" },
  "send-failed": {
    SEND_OK: "submitted",
    REJECTED: "rejected",
    RETRY: "sending",
    SEND_ERROR_RETRYABLE: "same",
    SEND_ERROR_FATAL: "failed",
    OFFLINE: "queued",
    CANCEL: "cancelled",
  },
  rejected: {},
  failed: {},
  expired: {},
  cancelled: {},
};

const CHAIN_EVENTS_ON_TERMINAL: Partial<Record<EventName, Expected>> = {
  GATEWAY_ACK_OK: "same",
  GATEWAY_ACK_REFUSED: "same",
  INCLUSION_CLAIM: "same",
  INCLUSION_VERIFIED: "same",
  FINALITY_OK: "same",
  DECISION: "same",
  EXPIRED: "same",
  REPLACED: "same",
  REDUCED: "same",
};

/** Chain evidence on a not-yet-accepted state; `stay` is the state's own kind. */
const preAcceptanceChain = (
  stay: ActionStateKind
): Partial<Record<EventName, Expected>> => ({
  GATEWAY_ACK_OK: "submitted",
  GATEWAY_ACK_REFUSED: "rejected",
  INCLUSION_CLAIM: "committed",
  INCLUSION_VERIFIED: "committed",
  FINALITY_OK: "finalized",
  DECISION: stay,
  EXPIRED: "expired",
  REPLACED: "replaced",
  REDUCED: stay,
});

const CHAIN_TABLE: Table = {
  draft: { SUBMIT_SIGNED: "awaiting-signature", CANCEL: "cancelled" },
  "awaiting-signature": {
    WALLET_SIGNED_TX: "signed",
    WALLET_REJECTED: "signature-rejected",
    TIMEOUT: "signature-rejected",
    CANCEL: "cancelled",
  },
  signed: {
    SEND: "sending",
    OFFLINE: "queued",
    CANCEL: "cancelled",
    ...preAcceptanceChain("signed"),
  },
  queued: {
    SEND: "sending",
    OFFLINE: "same",
    CANCEL: "cancelled",
    TIMEOUT: "expired",
    ...preAcceptanceChain("queued"),
  },
  sending: {
    SEND_ERROR_RETRYABLE: "send-failed",
    SEND_ERROR_FATAL: "failed",
    TIMEOUT: "send-failed",
    OFFLINE: "queued",
    ...preAcceptanceChain("sending"),
  },
  submitted: {
    GATEWAY_ACK_OK: "submitted",
    // The gateway already accepted; a later refusal from it does not count.
    GATEWAY_ACK_REFUSED: "submitted",
    INCLUSION_CLAIM: "committed",
    INCLUSION_VERIFIED: "committed",
    FINALITY_OK: "finalized",
    DECISION: "submitted",
    EXPIRED: "expired",
    REPLACED: "replaced",
    REDUCED: "reduced",
  },
  committed: {
    GATEWAY_ACK_OK: "committed",
    GATEWAY_ACK_REFUSED: "committed",
    INCLUSION_CLAIM: "committed",
    INCLUSION_VERIFIED: "committed",
    FINALITY_OK: "finalized",
    DECISION: "committed",
    EXPIRED: "expired",
    REPLACED: "replaced",
    REDUCED: "reduced",
  },
  finalized: {
    GATEWAY_ACK_OK: "finalized",
    GATEWAY_ACK_REFUSED: "finalized",
    INCLUSION_CLAIM: "finalized",
    INCLUSION_VERIFIED: "finalized",
    FINALITY_OK: "finalized",
    DECISION: "in-decision",
    // A verified result outranks a later expiry or replacement claim.
    EXPIRED: "finalized",
    REPLACED: "finalized",
    REDUCED: "reduced",
  },
  "in-decision": {
    GATEWAY_ACK_OK: "in-decision",
    GATEWAY_ACK_REFUSED: "in-decision",
    INCLUSION_CLAIM: "in-decision",
    INCLUSION_VERIFIED: "in-decision",
    FINALITY_OK: "in-decision",
    DECISION: "in-decision",
    EXPIRED: "in-decision",
    REPLACED: "in-decision",
    REDUCED: "reduced",
  },
  reduced: {
    GATEWAY_ACK_OK: "reduced",
    GATEWAY_ACK_REFUSED: "reduced",
    INCLUSION_CLAIM: "reduced",
    INCLUSION_VERIFIED: "reduced",
    FINALITY_OK: "reduced",
    DECISION: "reduced",
    EXPIRED: "expired",
    REPLACED: "replaced",
    REDUCED: "reduced",
  },
  "signature-rejected": { RETRY: "awaiting-signature", CANCEL: "cancelled" },
  "send-failed": {
    RETRY: "sending",
    SEND_ERROR_RETRYABLE: "same",
    SEND_ERROR_FATAL: "failed",
    OFFLINE: "queued",
    CANCEL: "cancelled",
    ...preAcceptanceChain("send-failed"),
  },
  // Outcomes that rest on gateway claims stay open to evidence (GW5).
  rejected: {
    GATEWAY_ACK_OK: "submitted",
    GATEWAY_ACK_REFUSED: "rejected",
    INCLUSION_CLAIM: "committed",
    INCLUSION_VERIFIED: "committed",
    FINALITY_OK: "finalized",
    DECISION: "rejected",
    EXPIRED: "expired",
    REPLACED: "replaced",
    REDUCED: "rejected",
  },
  "failed (claimed)": {
    GATEWAY_ACK_OK: "failed",
    GATEWAY_ACK_REFUSED: "failed",
    // The same gateway now reports success: its claim is replaced.
    INCLUSION_CLAIM: "committed",
    INCLUSION_VERIFIED: "failed",
    FINALITY_OK: "finalized",
    DECISION: "failed",
    EXPIRED: "expired",
    REPLACED: "replaced",
    REDUCED: "failed",
  },
  failed: CHAIN_EVENTS_ON_TERMINAL,
  expired: CHAIN_EVENTS_ON_TERMINAL,
  replaced: CHAIN_EVENTS_ON_TERMINAL,
  cancelled: CHAIN_EVENTS_ON_TERMINAL,
};

const OUTCOME_KINDS: ReadonlySet<ActionStateKind> = new Set([
  "rejected",
  "failed",
  "expired",
  "replaced",
  "cancelled",
]);

const ACCEPTED_KINDS: ReadonlySet<ActionStateKind> = new Set([
  "submitted",
  "committed",
  "finalized",
  "in-decision",
  "reduced",
]);

function stageRank(state: ActionState): number {
  if (!ACCEPTED_KINDS.has(state.kind) || !("chain" in state)) {
    return 0;
  }
  return state.chain === null
    ? CHAIN_LABEL_RANK.submitted
    : CHAIN_LABEL_RANK[state.chain.status.label];
}

let reports: IllegalTransition[] = [];
let restoreReporter: () => void = () => undefined;

beforeEach(() => {
  reports = [];
  restoreReporter = setIllegalTransitionReporter((report) => {
    reports.push(report);
  });
});

afterEach(() => {
  restoreReporter();
});

describe.each([
  ["server", SERVER_STATES, SERVER_TABLE],
  ["chain", CHAIN_STATES, CHAIN_TABLE],
] as const)("%s mode transition table", (mode, states, table) => {
  it("covers every state of the mode", () => {
    expect(Object.keys(table).sort()).toEqual(Object.keys(states).sort());
  });

  const cells = Object.keys(states).flatMap((stateName) =>
    EVENT_NAMES.map((eventName) => [stateName, eventName] as const)
  );

  it.each(cells)("%s + %s", (stateName, eventName) => {
    const state = states[stateName]!;
    const expected = table[stateName]?.[eventName];
    const result = step(state, EVENTS[eventName]);
    const reduced = transition(state, EVENTS[eventName]);

    expect(result.state.mode).toBe(mode);
    if (expected === undefined) {
      expect(result.legal).toBe(false);
      expect(result.state).toBe(state);
      expect(reduced).toBe(state);
      expect(reports).toEqual([
        { from: state.kind, mode, event: EVENTS[eventName].type },
      ]);
      return;
    }
    expect(result.legal).toBe(true);
    expect(reports).toEqual([]);
    if (expected === "same") {
      expect(result.state).toBe(state);
    } else {
      expect(result.state.kind).toBe(expected);
    }
    expect(reduced).toEqual(result.state);
  });
});

describe("server-mode sends", () => {
  it("runs the pending-send path: sending, posted", () => {
    let state: ActionState = createActionState("server");
    state = transition(state, EVENTS.SUBMIT_UNSIGNED);
    expect(state).toEqual({
      kind: "sending",
      mode: "server",
      attempt: 1,
      evidence: null,
    });
    state = transition(state, EVENTS.SEND_OK);
    expect(state).toEqual({
      kind: "submitted",
      mode: "server",
      attempt: 1,
      chain: null,
    });
    expect(isTerminalActionState(state)).toBe(true);
    expect(actionLabel(state).key).toBe("posted");
    // The echo and the response both report acceptance.
    expect(transition(state, EVENTS.SEND_OK)).toBe(state);
    expect(reports).toEqual([]);
  });

  it("counts attempts and schedules retries with backoff", () => {
    let state: ActionState = transition(
      createActionState("server"),
      EVENTS.SUBMIT_UNSIGNED
    );
    const retryTimes: (number | null)[] = [];
    for (let attempt = 1; attempt <= 6; attempt++) {
      expect(state).toMatchObject({ kind: "sending", attempt });
      state = transition(state, {
        type: "SEND_ERROR",
        retryable: true,
        at: 100_000,
        error: "offline",
      });
      expect(state).toMatchObject({
        kind: "send-failed",
        attempt,
        retryable: true,
        error: "offline",
      });
      retryTimes.push(state.kind === "send-failed" ? state.nextRetryAt : -1);
      state = transition(state, EVENTS.RETRY);
    }
    expect(retryTimes).toEqual([
      101_000,
      102_000,
      104_000,
      108_000,
      null,
      null,
    ]);
    expect(nextRetryAt(5, 0, { ...defaultPolicy(), maxAutoAttempts: 99 })).toBe(
      16_000
    );
    expect(nextRetryAt(9, 0, { ...defaultPolicy(), maxAutoAttempts: 99 })).toBe(
      30_000
    );
  });

  it("accepts a send whose response failed but whose echo arrived", () => {
    let state: ActionState = transition(
      createActionState("server"),
      EVENTS.SUBMIT_UNSIGNED
    );
    state = transition(state, EVENTS.TIMEOUT);
    expect(state).toMatchObject({ kind: "send-failed", error: "timeout" });
    state = transition(state, EVENTS.SEND_OK);
    expect(state.kind).toBe("submitted");
  });

  it("never labels a server-mode state with chain words", () => {
    const chainWords = new Set([
      "submitted",
      "committed",
      "committedReported",
      "finalized",
      "inDecision",
      "reduced",
      "replaced",
    ]);
    for (const state of reachableStates("server")) {
      expect(chainWords.has(actionLabel(state).key)).toBe(false);
    }
  });
});

describe("chain-mode labels", () => {
  it("delegates accepted stages to the status ladder copy", () => {
    expect(actionLabel(CHAIN_STATES["submitted"]!).key).toBe("submitted");
    expect(actionLabel(CHAIN_STATES["committed"]!)).toEqual({
      key: "committedReported",
      values: { count: "1" },
    });
    expect(actionLabel(CHAIN_STATES["finalized"]!).key).toBe("finalized");
    expect(actionLabel(CHAIN_STATES["in-decision"]!)).toEqual({
      key: "inDecision",
      values: { decision: DECISION_REF.decisionId },
    });
    expect(actionLabel(CHAIN_STATES["reduced"]!).key).toBe("reduced");
    expect(actionLabel(CHAIN_STATES["rejected"]!).key).toBe("rejected");
    // A send error, not the ladder, failed this one.
    expect(
      actionLabel(transition(CHAIN_STATES["sending"]!, EVENTS.SEND_ERROR_FATAL))
        .key
    ).toBe("failed");
  });

  it("needs every gateway to refuse before rejecting", () => {
    let state = CHAIN_STATES["sending"]!;
    state = transition(state, {
      type: "GATEWAY_ACK",
      gateway: GW1,
      code: REFUSAL,
    });
    expect(state.kind).toBe("rejected");

    state = transition(CHAIN_STATES["sending"]!, {
      type: "GATEWAY_ACK",
      gateway: GW2,
      code: null,
    });
    expect(state.kind).toBe("sending");
    state = transition(state, { type: "GATEWAY_ACK", gateway: GW1, code: 0 });
    expect(state.kind).toBe("submitted");
  });

  it("keeps a reported handler failure open until it is verified", () => {
    const claimed = transition(CHAIN_STATES["submitted"]!, {
      type: "INCLUSION",
      gateway: GW2,
      height: 4n,
      index: 1,
      code: HANDLER_FAILURE,
    });
    expect(claimed.kind).toBe("failed");
    expect(actionLabel(claimed).key).toBe("failed");
    // One gateway's report is a claim; a verified success overrules it.
    expect(isTerminalActionState(claimed)).toBe(false);
    expect(
      transition(claimed, {
        type: "FINALITY",
        height: 4n,
        index: 1,
        code: 0,
      }).kind
    ).toBe("finalized");

    const verified = transition(claimed, {
      type: "FINALITY",
      height: 4n,
      index: 1,
      code: HANDLER_FAILURE,
    });
    expect(verified.kind).toBe("failed");
    expect(isTerminalActionState(verified)).toBe(true);
    expect(transition(verified, EVENTS.FINALITY_OK)).toBe(verified);
  });

  it("puts a refused action back in flight when another gateway stays silent", () => {
    const rejected = CHAIN_STATES["rejected"]!;
    const next = transition(rejected, {
      type: "GATEWAY_ACK",
      gateway: GW2,
      code: null,
    });
    expect(next).toMatchObject({ kind: "sending", mode: "chain" });
  });
});

function defaultPolicy() {
  return {
    baseDelayMs: 1_000,
    factor: 2,
    maxDelayMs: 30_000,
    maxAutoAttempts: 5,
  };
}

/** Every state kind reachable from a draft, one representative each. */
function reachableStates(mode: ActionMode): ActionState[] {
  // `step` never reports, so exploring illegal moves is silent.
  const seen = new Map<ActionStateKind, ActionState>();
  let frontier: ActionState[] = [createActionState(mode)];
  seen.set("draft", frontier[0]!);
  for (let depth = 0; depth < 10 && frontier.length > 0; depth++) {
    const next: ActionState[] = [];
    for (const state of frontier) {
      for (const name of EVENT_NAMES) {
        const result = step(state, EVENTS[name]).state;
        if (!seen.has(result.kind)) {
          seen.set(result.kind, result);
          next.push(result);
        }
      }
    }
    frontier = next;
  }
  return [...seen.values()];
}

describe("properties", () => {
  it("reaches every state of each mode from a draft", () => {
    const kinds = (mode: ActionMode) =>
      reachableStates(mode)
        .map((state) => state.kind)
        .sort();
    expect(kinds("chain")).toEqual(
      [
        "awaiting-signature",
        "cancelled",
        "committed",
        "draft",
        "expired",
        "failed",
        "finalized",
        "in-decision",
        "queued",
        "reduced",
        "rejected",
        "replaced",
        "send-failed",
        "sending",
        "signature-rejected",
        "signed",
        "submitted",
      ].sort()
    );
    // Server mode has no chain stages and nothing to replace or reduce.
    expect(kinds("server")).toEqual(
      [
        "awaiting-signature",
        "cancelled",
        "draft",
        "expired",
        "failed",
        "queued",
        "rejected",
        "send-failed",
        "sending",
        "signature-rejected",
        "signed",
        "submitted",
      ].sort()
    );
  });

  it("keeps every terminal state stable under every event", () => {
    for (const mode of ["server", "chain"] as const) {
      for (const state of reachableStates(mode)) {
        if (!isTerminalActionState(state)) {
          continue;
        }
        for (const name of EVENT_NAMES) {
          expect(step(state, EVENTS[name]).state).toBe(state);
        }
      }
    }
  });

  it("never moves a chain stage backwards on random walks", () => {
    {
      // Seeded: every CI run walks the same 2,000 paths.
      const random = mulberry32(6529);
      const gateways = [GW1, GW2, GW3];
      const pick = <T>(values: readonly T[]): T =>
        values[Math.floor(random() * values.length)] as T;
      const randomEvent = (): ActionEvent => {
        const name = pick(EVENT_NAMES);
        const event = EVENTS[name];
        switch (event.type) {
          case "GATEWAY_ACK":
            return {
              ...event,
              gateway: pick(gateways),
              code: pick([0, 0, REFUSAL, null]),
            };
          case "INCLUSION":
            return random() < 0.5
              ? { type: "INCLUSION", height: 10n, index: 0 }
              : {
                  type: "INCLUSION",
                  gateway: pick(gateways),
                  height: pick([10n, 11n]),
                  index: 0,
                  code: pick([0, 0, 0, HANDLER_FAILURE]),
                };
          case "FINALITY":
            return { ...event, code: pick([0, 0, 0, HANDLER_FAILURE]) };
          case "EXPIRED":
          case "REPLACED":
            return random() < 0.5
              ? { type: event.type }
              : { type: event.type, gateway: pick(gateways) };
          default:
            return event;
        }
      };

      for (let walk = 0; walk < 2_000; walk++) {
        const mode: ActionMode = walk % 2 === 0 ? "chain" : "server";
        let state: ActionState = createActionState(mode);
        let accepted = false;
        let rank = 0;
        for (let move = 0; move < 40; move++) {
          const terminal = isTerminalActionState(state);
          const next: ActionState = step(state, randomEvent()).state;
          expect(next.mode).toBe(mode);
          if (terminal) {
            expect(next).toBe(state);
          }
          if (ACCEPTED_KINDS.has(next.kind)) {
            expect(stageRank(next)).toBeGreaterThanOrEqual(rank);
            rank = stageRank(next);
            accepted = true;
          } else if (accepted) {
            // Accepted actions move on or settle; they never go back.
            expect(OUTCOME_KINDS.has(next.kind)).toBe(true);
          }
          state = next;
        }
      }
    }
  });
});

describe("illegal-transition reporting", () => {
  it("reports to a per-call reporter instead of the default, and never throws", () => {
    const own: IllegalTransition[] = [];
    const draft = createActionState("server");
    expect(
      transition(draft, EVENTS.SEND_OK, { reporter: (r) => own.push(r) })
    ).toBe(draft);
    expect(own).toEqual([{ from: "draft", mode: "server", event: "SEND_OK" }]);
    expect(reports).toEqual([]);

    // null silences; a throwing reporter cannot break the caller.
    expect(transition(draft, EVENTS.SEND_OK, { reporter: null })).toBe(draft);
    expect(
      transition(draft, EVENTS.SEND_OK, {
        reporter: () => {
          throw new Error("reporter failed");
        },
      })
    ).toBe(draft);
    expect(reports).toEqual([]);
  });

  it("restores the previous default reporter", () => {
    const inner: IllegalTransition[] = [];
    const restore = setIllegalTransitionReporter((r) => inner.push(r));
    transition(createActionState("server"), EVENTS.RETRY);
    restore();
    transition(createActionState("server"), EVENTS.RETRY);
    expect(inner).toHaveLength(1);
    expect(reports).toHaveLength(1);
    reports = [];
  });
});

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}
