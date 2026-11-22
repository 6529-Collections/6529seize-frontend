/**
 * Safe transactions for 6529 Desktop: what the browser page shows for a
 * checked SafeTx. Everything comes from the signed message and the pins.
 */

import type { DecodedValue } from "@/lib/desktop/wallet-transactions/decode";
import type { DescribedTransactionArg } from "@/lib/desktop/wallet-transactions/describe";
import type { SafeTxCheck } from "./check";
import type { SafeTxRegistryPin } from "./pins";

/** How strongly the page warns: `critical` for a single-call-only call. */
export type SafeTxRisk = "normal" | "high" | "critical";

export interface SafeTxCallDescription {
  /** Lower-case registry address. */
  readonly registry: string;
  readonly registryName: SafeTxRegistryPin["name"];
  readonly ruleId: string;
  readonly functionName: string;
  readonly args: readonly DescribedTransactionArg[];
  readonly risk: SafeTxRisk;
}

export interface SafeTxDescription {
  readonly chainId: number;
  /** The Safe's EIP-55 address. */
  readonly safe: string;
  readonly nonce: bigint;
  /** 0: one call to a registry; 1: a MultiSendCallOnly batch. */
  readonly operation: 0 | 1;
  readonly calls: readonly SafeTxCallDescription[];
  readonly risk: SafeTxRisk;
}

const RISK_ORDER: readonly SafeTxRisk[] = ["normal", "high", "critical"];

/** A single-call-only call is critical; otherwise the rule's risk. */
function callRisk(singleCallOnly: boolean, risk: string): SafeTxRisk {
  if (singleCallOnly) return "critical";
  return risk === "high" ? "high" : "normal";
}

/** The page's view of a checked SafeTx (`check` must be ok). */
export function describeSafeTx(
  check: Extract<SafeTxCheck, { ok: true }>
): SafeTxDescription {
  const { pin } = check;
  const calls = check.calls.map((call): SafeTxCallDescription => {
    const registry = pin.registries.find(
      (item) => item.address === call.registry
    );
    const signature = call.rule.signature ?? "";
    return {
      registry: call.registry,
      registryName: registry?.name ?? "provenanceTest",
      ruleId: call.rule.id,
      functionName: signature.slice(0, signature.indexOf("(")),
      args: call.rule.args.map(({ name, type, components }) => ({
        name,
        type,
        value: call.args[name] as DecodedValue,
        ...(components === undefined ? {} : { components }),
      })),
      risk: callRisk(call.singleCallOnly, call.risk),
    };
  });
  const risk = calls.reduce<SafeTxRisk>(
    (worst, call) =>
      RISK_ORDER.indexOf(call.risk) > RISK_ORDER.indexOf(worst)
        ? call.risk
        : worst,
    "normal"
  );
  return {
    chainId: pin.chainId,
    safe: pin.safe,
    nonce: check.nonce,
    operation: check.operation,
    calls,
    risk,
  };
}
