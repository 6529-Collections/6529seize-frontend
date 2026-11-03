/**
 * @jest-environment node
 */
import type { Hex } from "viem";

import {
  applyLadderEvent,
  CHAIN_STATUS_COPY_EN,
  chainStatusCopy,
  deriveChainStatus,
  initialEvidence,
  type GatewayRef,
  type LadderEvent,
  type LadderEvidence,
} from "@/lib/chain/status-ladder";

const TX: Hex = `0x${"ab".repeat(32)}`;
const A: GatewayRef = { id: "a", operator: "op-a" };
const B: GatewayRef = { id: "b", operator: "op-b" };
const A2: GatewayRef = { id: "a2", operator: "op-a" };
const DECISION = { decisionId: `0x${"cd".repeat(32)}` as Hex, decisionTimeMs: 1_800_000_100_000n };

function run(events: readonly LadderEvent[]): LadderEvidence {
  return events.reduce(applyLadderEvent, initialEvidence(TX));
}

const status = (events: readonly LadderEvent[]) => deriveChainStatus(run(events));

describe("status ladder (P41 §5.3)", () => {
  it("starts at Signed", () => {
    expect(status([])).toMatchObject({ v: 1, txId: TX, label: "signed", overlay: null, verified: false });
  });

  it("counts operators, not endpoints, for Submitted", () => {
    expect(status([{ type: "submit-answer", gateway: A, code: 0 }])).toMatchObject({
      label: "submitted",
      reportedBy: 1,
    });
    expect(
      status([
        { type: "submit-answer", gateway: A, code: 0 },
        { type: "submit-answer", gateway: A2, code: 0 },
      ]).reportedBy
    ).toBe(1);
    expect(
      status([
        { type: "submit-answer", gateway: A, code: 0 },
        { type: "submit-answer", gateway: B, code: 0 },
      ]).reportedBy
    ).toBe(2);
  });

  it("is Rejected only when every gateway refused", () => {
    expect(
      status([
        { type: "submit-answer", gateway: A, code: 0x0104 },
        { type: "submit-answer", gateway: B, code: 0x0301 },
      ]).overlay
    ).toBe("rejected");
    const partial = status([
      { type: "submit-answer", gateway: A, code: 0x0104 },
      { type: "submit-silent", gateway: B },
    ]);
    expect(partial).toMatchObject({ label: "signed", overlay: null });
    expect(
      status([
        { type: "submit-answer", gateway: A, code: 0x0104 },
        { type: "submit-silent", gateway: B },
        { type: "submit-answer", gateway: B, code: 0 },
      ])
    ).toMatchObject({ label: "submitted", overlay: null });
  });

  it("shows Committed as reported until inclusion is verified", () => {
    const reported = status([
      { type: "submit-answer", gateway: A, code: 0 },
      { type: "inclusion-claim", gateway: A, height: 5n, index: 0, code: 0 },
      { type: "inclusion-claim", gateway: B, height: 5n, index: 0, code: 0 },
    ]);
    expect(reported).toMatchObject({ label: "committed", verified: false, reportedBy: 2, conflict: false });
    expect(reported.inclusion).toEqual({ height: 5n, index: 0 });
    expect(chainStatusCopy(reported)).toEqual({ key: "committedReported", values: { count: "2" } });
  });

  it("flags conflicting inclusion claims", () => {
    const conflicting = status([
      { type: "inclusion-claim", gateway: A, height: 5n, index: 0, code: 0 },
      { type: "inclusion-claim", gateway: B, height: 9n, index: 3, code: 0 },
    ]);
    expect(conflicting).toMatchObject({ label: "committed", conflict: true, reportedBy: 1 });
  });

  it("walks Committed -> Finalized -> In decision with verified evidence", () => {
    const base: LadderEvent[] = [
      { type: "submit-answer", gateway: A, code: 0 },
      { type: "inclusion-claim", gateway: A, height: 5n, index: 1, code: 0 },
      { type: "inclusion-verified", height: 5n, index: 1 },
    ];
    expect(status(base)).toMatchObject({ label: "committed", verified: true });
    expect(chainStatusCopy(status(base)).key).toBe("committed");
    const finalized = [...base, { type: "result-verified", height: 5n, index: 1, code: 0 } as const];
    expect(status(finalized)).toMatchObject({ label: "finalized", verified: true, resultCode: 0 });
    const decided = status([...finalized, { type: "decision-verified", decision: DECISION }]);
    expect(decided).toMatchObject({ label: "in-decision", decision: DECISION });
    expect(chainStatusCopy(decided)).toEqual({
      key: "inDecision",
      values: { decision: DECISION.decisionId },
    });
  });

  it("needs a verified result before In decision", () => {
    expect(status([{ type: "decision-verified", decision: DECISION }]).label).toBe("signed");
  });

  it("overlays Failed for handler codes, reported or verified", () => {
    expect(
      status([{ type: "inclusion-claim", gateway: A, height: 5n, index: 0, code: 0x2603 }])
    ).toMatchObject({ label: "committed", overlay: "failed", verified: false, resultCode: 0x2603 });
    expect(
      status([{ type: "result-verified", height: 5n, index: 0, code: 0x2603 }])
    ).toMatchObject({ overlay: "failed", verified: true, label: "committed" });
  });

  it("overlays Replaced and Expired", () => {
    expect(
      status([
        { type: "submit-answer", gateway: A, code: 0 },
        { type: "drop-claim", gateway: A, reason: "expired" },
        { type: "drop-claim", gateway: B, reason: "replaced" },
      ])
    ).toMatchObject({ label: "submitted", overlay: "replaced", reportedBy: 1 });
    expect(status([{ type: "drop-verified", reason: "expired" }])).toMatchObject({
      overlay: "expired",
      verified: true,
    });
  });

  it("shows Reduced as a change, not a failure", () => {
    const reduced = status([
      { type: "result-verified", height: 5n, index: 0, code: 0 },
      { type: "reduced", amount: 100n },
    ]);
    expect(reduced).toMatchObject({ label: "finalized", overlay: "reduced" });
  });

  it("never moves backwards when later answers are weaker", () => {
    const events: LadderEvent[] = [
      { type: "submit-answer", gateway: A, code: 0 },
      { type: "submit-silent", gateway: A },
      { type: "submit-answer", gateway: A, code: 0x0301 },
    ];
    expect(status(events).label).toBe("submitted");
  });

  it("never says Confirmed (audit H4)", () => {
    for (const copy of Object.values(CHAIN_STATUS_COPY_EN)) {
      expect(copy.toLowerCase()).not.toContain("confirm");
    }
  });
});
