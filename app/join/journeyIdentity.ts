import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const getProfileRouteIdentity = (
  profile: ApiIdentity | null,
  address: string | undefined
): string | null => {
  const primaryWallet = profile?.primary_wallet;
  return (
    profile?.normalised_handle ??
    profile?.handle ??
    primaryWallet?.toLowerCase() ??
    address?.toLowerCase() ??
    null
  );
};

export const getProfileHref = (
  profile: ApiIdentity | null,
  address: string | undefined
): string => {
  const routeIdentity = getProfileRouteIdentity(profile, address);
  return routeIdentity ? `/${routeIdentity}` : "/";
};
