/**
 * Chain mode: chain events fold into status-ladder evidence, and the ladder's
 * own derivation (`deriveChainStatus`) decides the stage. This file only
 * translates; the ladder rules live in `lib/chain/status-ladder.ts`.
 */
import {
  applyLadderEvent,
  deriveChainStatus,
  type ChainStatusLabel,
  type LadderEvent,
  type LadderEvidence,
} from "@/lib/chain/status-ladder";

import { assertNever, type ActionEvent, type ChainProgress } from "./types";

export type ChainActionEvent = Extract<
  ActionEvent,
  {
    readonly type:
      | "GATEWAY_ACK"
      | "INCLUSION"
      | "FINALITY"
      | "DECISION"
      | "EXPIRED"
      | "REPLACED"
      | "REDUCED";
  }
>;

const CHAIN_EVENT_TYPES: ReadonlySet<ActionEvent["type"]> = new Set([
  "GATEWAY_ACK",
  "INCLUSION",
  "FINALITY",
  "DECISION",
  "EXPIRED",
  "REPLACED",
  "REDUCED",
]);

export function isChainEvent(event: ActionEvent): event is ChainActionEvent {
  return CHAIN_EVENT_TYPES.has(event.type);
}

/** Ladder labels in order; a stage never moves to a lower rank. */
export const CHAIN_LABEL_RANK: Readonly<Record<ChainStatusLabel, number>> = {
  signed: 0,
  submitted: 1,
  committed: 2,
  finalized: 3,
  "in-decision": 4,
};

function dropEvent(
  reason: "expired" | "replaced",
  event: Extract<ChainActionEvent, { readonly type: "EXPIRED" | "REPLACED" }>
): LadderEvent {
  return event.gateway === undefined
    ? { type: "drop-verified", reason }
    : { type: "drop-claim", gateway: event.gateway, reason };
}

/** The one ladder observation a chain event carries. */
export function toLadderEvent(event: ChainActionEvent): LadderEvent {
  switch (event.type) {
    case "GATEWAY_ACK":
      return event.code === null
        ? { type: "submit-silent", gateway: event.gateway }
        : { type: "submit-answer", gateway: event.gateway, code: event.code };
    case "INCLUSION":
      return event.gateway === undefined
        ? {
            type: "inclusion-verified",
            height: event.height,
            index: event.index,
          }
        : {
            type: "inclusion-claim",
            gateway: event.gateway,
            height: event.height,
            index: event.index,
            code: event.code ?? 0,
          };
    case "FINALITY":
      return {
        type: "result-verified",
        height: event.height,
        index: event.index,
        code: event.code,
      };
    case "DECISION":
      return { type: "decision-verified", decision: event.decision };
    case "EXPIRED":
      return dropEvent("expired", event);
    case "REPLACED":
      return dropEvent("replaced", event);
    case "REDUCED":
      return { type: "reduced", amount: event.amount };
    default:
      // Unreachable: callers check `isChainEvent` first.
      return assertNever(event);
  }
}

/** Evidence with the ladder status derived from it. */
export function chainProgress(evidence: LadderEvidence): ChainProgress {
  return { evidence, status: deriveChainStatus(evidence) };
}

/** Folds one chain event into the evidence and derives the ladder status. */
export function foldChainEvent(
  evidence: LadderEvidence,
  event: ChainActionEvent
): ChainProgress {
  return chainProgress(applyLadderEvent(evidence, toLadderEvent(event)));
}
