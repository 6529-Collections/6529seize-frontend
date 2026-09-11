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
  const primaryWallet =
    typeof profile.primary_wallet === "string"
      ? profile.primary_wallet.trim()
      : "";
  const firstWallet = profile.wallets?.[0];
  const fallbackWallet =
    primaryWallet ||
    (firstWallet && typeof firstWallet.wallet === "string"
      ? firstWallet.wallet.trim()
      : "");

  if (!fallbackWallet) {
    throw new Error("getStatsPath: no wallet available on profile");
  }

  return `wallet/${fallbackWallet.toLowerCase()}`;
}

export function getCollectedStatsIdentityKey(profile: ApiIdentity) {
  const profileHandle = profile.handle?.trim();
  if (profileHandle) {
    return profileHandle.toLowerCase();
  }

  const primaryWallet =
    typeof profile.primary_wallet === "string"
      ? profile.primary_wallet.trim()
      : "";
  const firstWallet = profile.wallets?.[0];
  const fallbackWallet =
    primaryWallet ||
    (firstWallet && typeof firstWallet.wallet === "string"
      ? firstWallet.wallet.trim()
      : "");

  if (!fallbackWallet) {
    throw new Error(
      "getCollectedStatsIdentityKey: no identity key available on profile"
    );
  }

  return fallbackWallet.toLowerCase();
}

export function getProfileStatsPath(profile: ApiIdentity) {
  const wallets = new Set(
    (profile.wallets ?? [])
      .map(({ wallet }) => wallet.trim().toLowerCase())
      .filter(Boolean)
  );
  const primaryWallet =
    typeof profile.primary_wallet === "string"
      ? profile.primary_wallet.trim()
      : "";
  if (primaryWallet) wallets.add(primaryWallet.toLowerCase());
  if (!profile.consolidation_key && wallets.size > 1) {
    throw new Error(
      "getProfileStatsPath: confirmed consolidation is unavailable"
    );
  }
  return getStatsPath(profile, null);
}
