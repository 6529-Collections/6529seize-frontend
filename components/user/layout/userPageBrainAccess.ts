import type { ApiIdentity } from "@/generated/models/ApiIdentity";

type UserPageAccessState = {
  readonly connectedProfile: ApiIdentity | null;
  readonly connectionState:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";
  readonly fetchingProfile: boolean;
  readonly isClientHydrated: boolean;
};

const shouldDelayAccessRedirect = ({
  connectionState,
  isClientHydrated,
  isProfileHydrating,
}: Pick<UserPageAccessState, "connectionState" | "isClientHydrated"> & {
  readonly isProfileHydrating: boolean;
}): boolean => {
  const isWalletConnectingOrInitializing =
    connectionState === "initializing" || connectionState === "connecting";

  return (
    !isClientHydrated || isWalletConnectingOrInitializing || isProfileHydrating
  );
};

export function shouldDelayUserPageBrainRedirect({
  address,
  connectedProfile,
  connectionState,
  fetchingProfile,
  isClientHydrated,
}: UserPageAccessState & {
  readonly address: string | undefined;
}): boolean {
  const isProfileHydrating = !!address && fetchingProfile && !connectedProfile;

  return shouldDelayAccessRedirect({
    connectionState,
    isClientHydrated,
    isProfileHydrating,
  });
}

export function shouldDelayUserPageOwnerTabRedirect({
  connectedProfile,
  connectionState,
  fetchingProfile,
  isClientHydrated,
}: UserPageAccessState): boolean {
  const isProfileHydrating = fetchingProfile && !connectedProfile;

  return shouldDelayAccessRedirect({
    connectionState,
    isClientHydrated,
    isProfileHydrating,
  });
}
