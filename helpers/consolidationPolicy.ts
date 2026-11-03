export interface ConsolidationLimits {
  readonly maxWallets: number;
  readonly ungatedMaxWallets: number;
}

export interface ConsolidationPolicy extends ConsolidationLimits {
  readonly activationMs: number;
  readonly signingOpensMs: number;
}

/** Wallet limits are usable independently of the signing cutoff. */
export function parseConsolidationLimits(
  value: unknown
): ConsolidationLimits | null {
  if (value === null || typeof value !== "object") return null;
  const maxWallets: unknown = Reflect.get(value, "max_wallets");
  const ungatedMaxWallets: unknown = Reflect.get(value, "ungated_max_wallets");
  if (
    typeof maxWallets !== "number" ||
    !Number.isSafeInteger(maxWallets) ||
    maxWallets < 2 ||
    typeof ungatedMaxWallets !== "number" ||
    !Number.isSafeInteger(ungatedMaxWallets) ||
    ungatedMaxWallets < 2 ||
    ungatedMaxWallets > maxWallets
  )
    return null;
  return { maxWallets, ungatedMaxWallets };
}

function parseUtc(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.000)?Z$/.test(value)
  )
    return null;
  const milliseconds = Date.parse(value);
  const normalized = value.endsWith(".000Z")
    ? value
    : value.replace(/Z$/, ".000Z");
  return Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === normalized
    ? milliseconds
    : null;
}

/** Older or malformed settings never enable four-wallet signing. */
export function parseConsolidationPolicy(
  value: unknown
): ConsolidationPolicy | null {
  if (value === null || typeof value !== "object") return null;
  const limits = parseConsolidationLimits(value);
  if (!limits) return null;
  const activationMs = parseUtc(
    Reflect.get(value, "four_wallet_activation_at")
  );
  const signingOpensMs = parseUtc(
    Reflect.get(value, "four_wallet_signing_opens_at")
  );
  if (
    activationMs === null ||
    signingOpensMs === null ||
    signingOpensMs <= activationMs
  )
    return null;
  return { ...limits, activationMs, signingOpensMs };
}
