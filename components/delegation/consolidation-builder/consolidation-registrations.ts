import { CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS } from "@/constants/consolidation.constants";
import { isAddress } from "viem";
import { toDirectedLinkKey, toWalletKey } from "./consolidation-plan";

const ACTIVATION_SECONDS = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS / 1000;

/**
 * One stored consolidation pair from
 * `GET /api/consolidations/{wallet}?show_incomplete=true`. A pair is stored
 * as (first registrant, second registrant): wallet1 -> wallet2 is always
 * registered, and wallet2 -> wallet1 only when the row is confirmed. Each
 * `registeredAt` is the block time (Unix seconds) of that wallet's latest
 * registration, or undefined when it predates tracking.
 */
interface ConsolidationRow {
  readonly wallet1: string;
  readonly wallet2: string;
  readonly confirmed: boolean;
  readonly wallet1RegisteredAt: number | undefined;
  readonly wallet2RegisteredAt: number | undefined;
}

function parseRegisteredAt(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return undefined;
}

function parseConfirmed(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseRow(row: unknown): ConsolidationRow | undefined {
  if (typeof row !== "object" || row === null) {
    return undefined;
  }
  const wallet1: unknown = Reflect.get(row, "wallet1");
  const wallet2: unknown = Reflect.get(row, "wallet2");
  if (
    typeof wallet1 !== "string" ||
    typeof wallet2 !== "string" ||
    !isAddress(wallet1, { strict: false }) ||
    !isAddress(wallet2, { strict: false })
  ) {
    return undefined;
  }
  return {
    wallet1: toWalletKey(wallet1),
    wallet2: toWalletKey(wallet2),
    confirmed: parseConfirmed(Reflect.get(row, "confirmed")),
    wallet1RegisteredAt: parseRegisteredAt(
      Reflect.get(row, "wallet1_registered_at")
    ),
    wallet2RegisteredAt: parseRegisteredAt(
      Reflect.get(row, "wallet2_registered_at")
    ),
  };
}

export function parseConsolidationRows(response: unknown): ConsolidationRow[] {
  const data: unknown =
    typeof response === "object" && response !== null
      ? Reflect.get(response, "data")
      : undefined;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.flatMap((row) => parseRow(row) ?? []);
}

// Same rule as the backend's isPostActivationLink (consolidation-tools.ts):
// block time in Unix seconds, inclusive of the activation second.
function isFreshTime(registeredAt: number | undefined): boolean {
  return registeredAt !== undefined && registeredAt >= ACTIVATION_SECONDS;
}

/**
 * Directions between listed wallets that 6529 recorded as registered at or
 * after the fourth-slot activation. Rows repeat across wallets' responses;
 * a direction counts as fresh when any copy says so.
 */
export function getFreshLinkKeys(
  rowsByWallet: readonly (readonly ConsolidationRow[])[],
  wallets: readonly string[]
): string[] {
  const listed = new Set(wallets.map(toWalletKey));
  const fresh = new Set<string>();

  for (const row of rowsByWallet.flat()) {
    if (!listed.has(row.wallet1) || !listed.has(row.wallet2)) {
      continue;
    }
    if (isFreshTime(row.wallet1RegisteredAt)) {
      fresh.add(toDirectedLinkKey(row.wallet1, row.wallet2));
    }
    if (row.confirmed && isFreshTime(row.wallet2RegisteredAt)) {
      fresh.add(toDirectedLinkKey(row.wallet2, row.wallet1));
    }
  }

  return [...fresh];
}
