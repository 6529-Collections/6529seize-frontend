/**
 * Which label describes a state. Keys only: the rendering component maps
 * them to localized copy. Server mode never uses chain words: its accepted
 * state reads "posted" (shown as "Posted" or "Sent"), never "Submitted" or
 * "Confirmed".
 */
import {
  chainStatusCopy,
  type ChainStatusCopyKey,
} from "@/lib/chain/status-ladder";

import type { ActionState } from "./types";

export type ActionLabelKey =
  | "draft"
  | "awaiting-signature"
  | "signed"
  | "queued"
  | "sending"
  | "posted"
  | "signature-rejected"
  | "send-failed"
  | "rejected"
  | "failed"
  | "expired"
  | "cancelled"
  | ChainStatusCopyKey;

export interface ActionLabel {
  readonly key: ActionLabelKey;
  readonly values: Readonly<Record<string, string>>;
}

const NO_VALUES: Readonly<Record<string, string>> = Object.freeze({});

export function actionLabel(state: ActionState): ActionLabel {
  switch (state.kind) {
    case "submitted":
      return state.chain === null
        ? { key: "posted", values: NO_VALUES }
        : chainStatusCopy(state.chain.status);
    case "committed":
    case "finalized":
    case "in-decision":
    case "reduced":
    case "replaced":
      return chainStatusCopy(state.chain.status);
    case "rejected":
    case "failed":
    case "expired":
      // The ladder's copy applies only when the ladder decided the outcome.
      return state.chain?.status.overlay === state.kind
        ? chainStatusCopy(state.chain.status)
        : { key: state.kind, values: NO_VALUES };
    case "draft":
    case "awaiting-signature":
    case "signed":
    case "queued":
    case "sending":
    case "signature-rejected":
    case "send-failed":
    case "cancelled":
      return { key: state.kind, values: NO_VALUES };
  }
}
