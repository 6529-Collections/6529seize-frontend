import type { Hex } from "viem";
import { chainGateway } from "./gateway";

/** Chain state records this site reads by key (`/v1/state/{key}`). */

const FAMILY_BALANCE = "0901";
const FAMILY_CAPABILITY = "0301";
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

const DECIMAL = /^\d+$/;

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
): Promise<bigint> =>
  readBalance(HOLDER_PRINCIPAL, principalId, asset, signal);

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
