/**
 * Safe transactions for 6529 Desktop: the canonical form of the SafeTx
 * table (pins, schema, batch limits, single-call list and governance
 * rules). 6529 Desktop keeps the same table and reports the SHA-256 of
 * this text as `safeTx` in its capabilities; the website asks it to sign a
 * Safe transaction only when the two are equal.
 */

import { sha256 } from "viem";
import {
  canonicalJson,
  canonicalTransactionRulesJson,
} from "@/lib/desktop/wallet-transactions/hash";
import { governanceRules, SINGLE_CALL_ONLY } from "./governance-rules";
import { SAFE_TX_BATCH, SAFE_TX_FIELDS, SAFE_TX_PINS } from "./pins";

/** Format version of the canonical SafeTx JSON. */
const SAFE_TX_FORMAT_VERSION = 1;

/** The table as plain data, before canonical ordering. */
function safeTxTable() {
  return {
    v: SAFE_TX_FORMAT_VERSION,
    primaryType: "SafeTx",
    fields: SAFE_TX_FIELDS,
    batch: SAFE_TX_BATCH,
    singleCallOnly: SINGLE_CALL_ONLY,
    pins: SAFE_TX_PINS.map((pin) => ({
      chainId: pin.chainId,
      safe: pin.safe,
      multiSendCallOnly: pin.multiSendCallOnly,
      registries: pin.registries.map((registry) => registry.address),
    })),
    // The governance rules in the transaction rules' canonical form.
    rules: (
      JSON.parse(
        canonicalTransactionRulesJson(
          SAFE_TX_PINS.flatMap((pin) =>
            pin.registries.flatMap((registry) =>
              governanceRules(pin.chainId, registry.address)
            )
          )
        )
      ) as { readonly rules: unknown }
    ).rules,
  };
}

/** Canonical JSON: keys sorted at every level, arrays in order. */
export const canonicalSafeTxJson = (): string => canonicalJson(safeTxTable());

let ownHash: string | null = null;

/** SHA-256 of the canonical JSON (64 lower-case hex), computed once. */
export function walletSafeTxHash(): string {
  ownHash ??= sha256(new TextEncoder().encode(canonicalSafeTxJson())).slice(2);
  return ownHash;
}
