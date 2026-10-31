import { UserRejectedRequestError } from "viem";

export function isUserRejectedSigningError(error: unknown): boolean {
  try {
    if (error instanceof UserRejectedRequestError) return true;
  } catch {
    // Wallet errors may cross realms; also recognize their standard shape.
  }
  if (error === null || typeof error !== "object") return false;
  const value = error as Record<string, unknown>;
  return (
    value["name"] === "UserRejectedRequestError" ||
    value["code"] === 4001 ||
    value["code"] === "4001"
  );
}

// WalletConnect SDK and relay failures: an expired or missing session or
// pairing, an expired request, or a relay that cannot deliver it.
const WALLET_CONNECT_SESSION_ERROR_PATTERNS: readonly RegExp[] = [
  /session topic doesn't exist/i,
  /pairing topic doesn't exist/i,
  /no matching key/i,
  /\b(session|pairing|proposal|request) expired\b/i,
  /\bexpired\.\s+(session|pairing)\b/i,
  /\brelayer?\b/i,
  /websocket/i,
  /socket stalled/i,
  /failed to publish/i,
];

const MAX_ERROR_CAUSE_DEPTH = 5;

function getErrorTexts(value: Record<string, unknown>): string[] {
  return ["message", "shortMessage", "details"]
    .map((key) => value[key])
    .filter((text): text is string => typeof text === "string");
}

/**
 * A WalletConnect session that can no longer reach the wallet app: pairing
 * the wallet again is the fix. Checks the error and its causes.
 */
export function isWalletConnectSessionError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < MAX_ERROR_CAUSE_DEPTH; depth += 1) {
    if (current === null || typeof current !== "object") {
      return false;
    }
    const value = current as Record<string, unknown>;
    if (
      getErrorTexts(value).some((text) =>
        WALLET_CONNECT_SESSION_ERROR_PATTERNS.some((pattern) =>
          pattern.test(text)
        )
      )
    ) {
      return true;
    }
    current = value["cause"];
  }
  return false;
}
