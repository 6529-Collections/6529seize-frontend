import { ApiIdentity } from "@/generated/models/ApiIdentity";

export function getStatsPath(
  profile: ApiIdentity,
  activeAddress: string | null
) {
  if (activeAddress) {
    return `wallet/${activeAddress}`;
  }
  if (profile.consolidation_key) {
    return `consolidation/${profile.consolidation_key}`;
  }
  return `wallet/${profile.wallets?.[0].wallet}`;
}
