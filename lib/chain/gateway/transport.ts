/**
 * The gateway port: what the client needs from one chain gateway.
 *
 * Source: P41 §5.1 GW1-GW7 and the `track()` sketch of §5.3. A gateway
 * relays signed bytes unchanged, returns the CheckTx code and detail (GW1),
 * answers reads with a height (GW2), never signs (GW3), and every status
 * it reports is a claim until verified (GW5).
 *
 * The design gives rules, not a method list (R1 §1.8), so these methods are
 * this client's own and stay behind the port: `submit` (GW1), `locate`
 * (P41 §5.3's `locate(txId) -> (h, i, code) or pending`) and `head` (for
 * expiry). An engine's real RPC becomes another transport.
 */
import type { Hex } from "viem";

import type { GatewayRef } from "../status-ladder";

export interface CheckTxAnswer {
  /** P40 result code; 0 means admitted to the mempool. */
  readonly code: number;
  /** P40 §2.6 detail. */
  readonly detail: number;
}

/** An opaque proof object a `ProofVerifier` understands. */
export interface ChainEvidence {
  readonly kind: string;
  readonly payload: unknown;
}

export interface DecisionClaim {
  readonly decisionId: Hex;
  readonly decisionTimeMs: bigint;
  readonly evidence: ChainEvidence | null;
}

export type TxLocation =
  | { readonly status: "pending" }
  | { readonly status: "absent" }
  | {
      readonly status: "included";
      readonly height: bigint;
      readonly index: number;
      readonly code: number;
      readonly detail: number;
      readonly evidence: ChainEvidence | null;
      readonly decision: DecisionClaim | null;
    }
  | { readonly status: "dropped"; readonly reason: "expired" | "replaced" };

export type IncludedLocation = Extract<TxLocation, { status: "included" }>;

export interface GatewayHead {
  readonly height: bigint;
  /** Protocol time in milliseconds (P28 §2.3). */
  readonly timeMs: bigint;
}

export interface GatewayTransport {
  readonly ref: GatewayRef;
  submit(tx: Uint8Array, signal?: AbortSignal): Promise<CheckTxAnswer>;
  locate(txId: Hex, signal?: AbortSignal): Promise<TxLocation>;
  head(signal?: AbortSignal): Promise<GatewayHead>;
}

/**
 * Turns gateway claims into verified evidence: a light client in the
 * target design (P41 §5.4). None is specified for the adopted engine yet,
 * so production code passes none; the mock supplies one for tests.
 */
export interface ProofVerifier {
  verifyInclusion(txId: Hex, location: IncludedLocation, signal?: AbortSignal): Promise<boolean>;
  /** Header h+1 verified, result code under it, the record state-proven. */
  verifyResult(txId: Hex, location: IncludedLocation, signal?: AbortSignal): Promise<boolean>;
  verifyDecision(txId: Hex, claim: DecisionClaim, signal?: AbortSignal): Promise<boolean>;
}
