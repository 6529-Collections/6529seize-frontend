import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export function getStatsPath(
  profile: ApiIdentity,
  activeAddress: string | null
) {
  const normalizedActiveAddress = activeAddress?.trim();
  if (normalizedActiveAddress) {
    return `wallet/${normalizedActiveAddress.toLowerCase()}`;
  }
  if (profile.consolidation_key) {
    return `consolidation/${profile.consolidation_key}`;
  }
  const fallbackWallet =
    profile.primary_wallet?.trim() ||
    profile.wallets?.[0]?.wallet?.trim();

  if (!fallbackWallet) {
    throw new Error("getStatsPath: no wallet available on profile");
  }

  return `wallet/${fallbackWallet.toLowerCase()}`;
}
