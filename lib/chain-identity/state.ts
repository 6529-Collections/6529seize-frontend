import type { Hex } from "viem";
import { chainGateway } from "./gateway";

/** Chain state records this site reads by key (`/v1/state/{key}`). */

const FAMILY_BALANCE = "0901";
const FAMILY_CAPABILITY = "0301";
const FAMILY_RATING = "0701";
const FAMILY_RATER_BUDGET = "0703";
/** RATING_SET's targetKind for an identity. */
const TARGET_PRINCIPAL = "01";
const HOLDER_PRINCIPAL = "01";
const HOLDER_ADDRESS = "02";

/** Capability status values (CHAIN-SPEC 1.3): OFFERED 1, ACTIVE 2, REVOKED 4. */
const GRANT_ACTIVE = 2;

const HEX_DIGITS = /^[0-9a-f]+$/;

const word = (value: Hex): string => {
  const hex = value.slice(2).toLowerCase();
  if (!HEX_DIGITS.test(hex) || hex.length > 64) {
    throw new RangeError("expected at most 32 bytes of hex");
  }
  return hex.padStart(64, "0");
};

/** An address as the 32-byte word the chain keys an address account by. */
export const addressWord = (address: Hex): Hex => `0x${word(address)}`;

const DECIMAL = /^-?\d+$/;

/** A record's integer field: a JSON number, or a decimal string past 32 bits. */
const toBigInt = (value: unknown): bigint => {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && DECIMAL.test(value)) {
    return BigInt(value);
  }
  return 0n;
};

/** A one-byte key field as two hex digits. */
const byte = (value: number): string => {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError("expected one byte");
  }
  return value.toString(16).padStart(2, "0");
};

async function readBalance(
  holderKind: string,
  holder: Hex,
  asset: Hex,
  signal?: AbortSignal
): Promise<bigint> {
  const key: Hex = `0x${FAMILY_BALANCE}${holderKind}${word(holder)}${word(asset)}`;
  const record = await chainGateway.getState(key, signal);
  return toBigInt(record.valueFields?.["amount"]);
}

/** An identity's balance of `asset`: what its operations' fees come from. */
export const readIdentityBalance = (
  principalId: Hex,
  asset: Hex,
  signal?: AbortSignal
): Promise<bigint> => readBalance(HOLDER_PRINCIPAL, principalId, asset, signal);

/** A wallet's own address account: the drip pays here. */
export const readWalletBalance = (
  wallet: Hex,
  asset: Hex,
  signal?: AbortSignal
): Promise<bigint> => readBalance(HOLDER_ADDRESS, wallet, asset, signal);

interface ChainGrantState {
  readonly active: boolean;
  readonly version: number;
  readonly expiresAtMs: number;
}

/** A capability grant as the chain holds it, or null when there is none. */
export async function readGrant(
  grantId: Hex,
  nowMs: number,
  signal?: AbortSignal
): Promise<ChainGrantState | null> {
  const record = await chainGateway.getState(
    `0x${FAMILY_CAPABILITY}${word(grantId)}`,
    signal
  );
  const fields = record.valueFields;
  if (!fields) {
    return null;
  }
  const expiresAtMs = Number(toBigInt(fields["expiresAt"]));
  return {
    active:
      Number(toBigInt(fields["status"])) === GRANT_ACTIVE &&
      nowMs < expiresAtMs,
    version: Number(toBigInt(fields["version"])),
    expiresAtMs,
  };
}

/**
 * A rater's REP (matter 1) or NIC (matter 2) rating of an identity in one
 * category (zero for NIC), as the chain holds it: `Rating[rater, matter,
 * targetKind, target, category]`. `updatedHeight` is the version RATING_SET's
 * `priorVersion` must name. Null when there is none.
 */
export async function readRating(
  rater: Hex,
  matter: number,
  target: Hex,
  category: Hex,
  signal?: AbortSignal
): Promise<{ readonly value: bigint; readonly updatedHeight: number } | null> {
  const key: Hex = `0x${FAMILY_RATING}${word(rater)}${byte(matter)}${TARGET_PRINCIPAL}${word(target)}${word(category)}`;
  const record = await chainGateway.getState(key, signal);
  const fields = record.valueFields;
  if (!fields) {
    return null;
  }
  return {
    value: toBigInt(fields["value"]),
    updatedHeight: Number(toBigInt(fields["updatedHeight"])),
  };
}

/**
 * What a rater has given in one matter: the sum of its ratings' sizes,
 * `RaterBudget[rater, matter].spent`, which its TDH caps. 0 when none.
 */
export async function readRaterSpent(
  rater: Hex,
  matter: number,
  signal?: AbortSignal
): Promise<bigint> {
  const key: Hex = `0x${FAMILY_RATER_BUDGET}${word(rater)}${byte(matter)}`;
  const record = await chainGateway.getState(key, signal);
  return toBigInt(record.valueFields?.["spent"]);
}
