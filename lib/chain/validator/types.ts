/**
 * The validator's local API bodies, JSON "format 1".
 *
 * Mirrors `6529validator` `crates/node-api/src/status.rs` and
 * `crates/node-api/src/types.rs` on branch `claude/blissful-perlman-914dca`
 * (head 00024be, 2026-11-02): `CertificateView`, `CycleRecord` and the
 * structs they embed. Field names are the JSON's (snake_case). Hashes are
 * `0x` hex, times are protocol Unix seconds, TDH and weights are integers
 * below 2^53 (status.rs module docs).
 *
 * Format 1 is additive: a field is never removed or retyped, and fields
 * added later carry serde defaults (ARCHITECTURE.md §7.1). The parser in
 * `parse.ts` therefore ignores unknown fields, fills those defaults, and
 * keeps enum-like values as strings so a newer node's values still read.
 */
import type { Hex } from "viem";

export const VALIDATOR_STATUS_FORMAT = 1;

/** `STRONG` (3 signed > 2 W), `MAJORITY` (2 signed > W) or `WEAK` (ARCHITECTURE.md §2.7). */
export const CERTIFICATE_LEVELS = ["STRONG", "MAJORITY", "WEAK"] as const;
export type KnownCertificateLevel = (typeof CERTIFICATE_LEVELS)[number];

/** `CAP_INACTIVE`, `LATE`, `FINAL`, `SPLIT`. */
export const CERTIFICATE_FLAGS = ["CAP_INACTIVE", "LATE", "FINAL", "SPLIT"] as const;

/** types.rs `CycleState`, SCREAMING_SNAKE_CASE. */
export const CYCLE_STATES = [
  "OPEN",
  "CLOSED",
  "COMPUTING",
  "SIGNED",
  "NOT_SIGNED",
  "CERTIFIED",
  "FROZEN",
] as const;

export interface HeaderView {
  readonly cycle_day: number;
  readonly boundary: number;
  readonly tdh_rule_id: Hex;
  readonly cutoff_number: number;
  readonly cutoff_hash: Hex;
  readonly cutoff_timestamp: number;
  readonly wallet_root: Hex;
  readonly wallet_count: number;
  readonly identity_count: number;
  readonly total_tdh: number;
  readonly token_root: Hex;
  readonly token_count: number;
}

export interface WindowView {
  readonly opens: number;
  readonly closes: number;
  readonly final_at: number;
  readonly frozen_at: number;
  readonly late: boolean;
}

export interface KeyOutcome {
  readonly key_id: Hex;
  /** `SIGNED`, `NOT_SIGNED` or `PENDING`. */
  readonly outcome: string;
  readonly reason: string | null;
  readonly signed_unix: number | null;
  readonly published_unix: number | null;
  readonly grant_hash: Hex | null;
  readonly in_certificate: boolean;
}

export interface SourceView {
  /** `OWN_NODE` or `VERIFIED`. */
  readonly class: string;
  readonly source_text: string;
  readonly servers: readonly string[];
  readonly anchor_number: number;
}

export interface DualRunReport {
  readonly implementations: number;
  /** `NOT_RUN`, `AGREED` or `MISMATCH`. */
  readonly outcome: string;
  readonly differences: readonly string[];
  readonly millis: readonly [number, number, number];
}

export interface CertificateView {
  readonly cycle_day: number;
  readonly cycle_root: Hex;
  readonly level: string;
  readonly signed_weight: number;
  readonly w: number;
  readonly weight_own_node: number;
  readonly weight_verified: number;
  readonly raw_signed_tdh: number;
  readonly raw_registered_tdh: number;
  readonly network_tdh: number;
  readonly signing_accounts: number;
  readonly roster_count: number;
  readonly roster_root: Hex;
  readonly weight_basis: Hex;
  readonly flags: readonly string[];
  readonly excluded_accounts: number;
  /** The node's claim that it checked every aggregate. */
  readonly verified_here: boolean;
  readonly ours: boolean;
  // serde(default) fields:
  readonly key_count: number;
  readonly signed_keys: number;
  readonly roster_accounts: number;
  readonly signer_weights: readonly number[];
  readonly unsigned_weights: readonly number[];
  readonly own_weight: number | null;
  readonly own_signed: number;
  /** 0 when the node checked it; otherwise how many validators sent it. */
  readonly reported_by: number;
  readonly strong_unix: number | null;
}

export interface CompareView {
  /** `COMPARED`, `PENDING_LIVE`, `LIVE_GAP` or `SKIPPED`. */
  readonly status: string;
  readonly identities_compared: number;
  readonly identities_differing: number;
  readonly wallets_compared: number;
  readonly wallets_differing: number;
  readonly by_class: readonly [number, number, number, number];
  readonly totals: readonly [number, number] | null;
  readonly compared_unix: number | null;
}

export interface CycleRecord {
  readonly format: typeof VALIDATOR_STATUS_FORMAT;
  readonly day: number;
  readonly state: string;
  /** While CLOSED: `WAITING_FINALITY`, `WAITING_SOURCE`, `WAITING_HISTORY`, `WAITING_WEIGHTS`, `CLOCK`. */
  readonly waiting: string | null;
  readonly not_signed: string | null;
  readonly window: WindowView;
  readonly finalized_unix: number | null;
  /** `FULL_CHECK`, `NETWORK_AGREED`, `REPLAY` or `UNCHECKED`. */
  readonly history_kind: string | null;
  readonly header: HeaderView | null;
  readonly cycle_root: Hex | null;
  readonly history_root: Hex | null;
  readonly history_count: number | null;
  readonly source: SourceView | null;
  readonly dual_run: DualRunReport | null;
  readonly keys: readonly KeyOutcome[];
  readonly certificate: CertificateView | null;
  readonly other_roots: readonly CertificateView[];
  readonly compare: CompareView | null;
  readonly compute_millis: number | null;
  readonly computed_unix: number | null;
  readonly updated_unix: number;
}

/** ARCHITECTURE.md §2.7: STRONG `3 signed > 2 W`, MAJORITY `2 signed > W`, else WEAK. */
export function certificateLevel(signedWeight: number, w: number): KnownCertificateLevel {
  if (3 * signedWeight > 2 * w) {
    return "STRONG";
  }
  return 2 * signedWeight > w ? "MAJORITY" : "WEAK";
}

export function isFinalCertificate(view: CertificateView): boolean {
  return view.flags.includes("FINAL");
}
