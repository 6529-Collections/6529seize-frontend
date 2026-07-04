import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const ABOUT_SUBSCRIPTIONS_HREF = "/about/subscriptions";

export function getProfileSubscriptionsHref(
  connectedProfile: ApiIdentity | null | undefined
): string | undefined {
  const profilePathCandidate =
    connectedProfile?.normalised_handle?.trim() ||
    connectedProfile?.handle?.trim() ||
    connectedProfile?.primary_wallet?.trim() ||
    connectedProfile?.wallets?.[0]?.wallet?.trim();

  return profilePathCandidate
    ? `/${encodeURIComponent(profilePathCandidate)}/subscriptions`
    : undefined;
}
