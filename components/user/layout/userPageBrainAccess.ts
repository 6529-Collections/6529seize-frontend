import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export function shouldDelayUserPageBrainRedirect({
  address,
  connectedProfile,
  connectionState,
  fetchingProfile,
  isClientHydrated,
}: {
  readonly address: string | undefined;
  readonly connectedProfile: ApiIdentity | null;
  readonly connectionState:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";
  readonly fetchingProfile: boolean;
  readonly isClientHydrated: boolean;
}): boolean {
  if (!isClientHydrated) {
    return true;
  }

  const isWalletConnectingOrInitializing =
    connectionState === "initializing" || connectionState === "connecting";
  const isProfileHydrating = !!address && fetchingProfile && !connectedProfile;

  return isWalletConnectingOrInitializing || isProfileHydrating;
}
