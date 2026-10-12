export interface ConsolidationPolicy {
  readonly activationMs: number;
  readonly signingOpensMs: number;
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
  if (!value || typeof value !== "object") return null;
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
  return { activationMs, signingOpensMs };
}
