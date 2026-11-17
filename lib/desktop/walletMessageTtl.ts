/**
 * Lifetime of the action messages 6529 Desktop forwards (drop and decision
 * signatures): exactly 5 minutes from issue to expiry, as the app builds
 * them. Kept free of imports so tests can share it.
 */
export const WALLET_MESSAGE_TTL_MS = 300_000;
