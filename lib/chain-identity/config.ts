import { publicEnv } from "@/config/env";

/**
 * The public chain gateway's base URL, without a trailing slash, or null
 * when this build has none.
 */
export function getChainGatewayUrl(): string | null {
  const raw = publicEnv.NEXT_PUBLIC_CHAIN_GATEWAY_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return null;
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/**
 * Whether this build changes identities, profiles, handles, REP, NIC,
 * wallets and delegations on the 6529 Network, through the gateway.
 */
export function isChainIdentityEnabled(): boolean {
  return (
    publicEnv.NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY === "true" &&
    getChainGatewayUrl() !== null
  );
}
