import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getProfileConnectedStatus } from "@/helpers/ProfileHelpers";
import { useMemo } from "react";
import type { AuthContextType } from "./authTypes";

type AuthContextValueParams = Required<
  Omit<
    AuthContextType,
    "connectedProfile" | "connectionStatus" | "isAuthenticated"
  >
> & {
  readonly connectedProfile: ApiIdentity | null | undefined;
  readonly isAddressAuthorized: boolean;
};

/** The memoized AuthContext value derived from the provider's state. */
export function useAuthContextValue({
  activeProfileProxy,
  connectedProfile,
  ensureActiveSessionV2WebSession,
  fetchingProfile,
  isAddressAuthorized,
  isDirectProfileSession,
  receivedProfileProxies,
  requestAuth,
  requestSessionUpgrade,
  requestSignedMessagesGrant,
  sessionUpgradeRequired,
  setActiveProfileProxy,
  setToast,
  showWaves,
}: AuthContextValueParams): AuthContextType {
  return useMemo<AuthContextType>(
    () => ({
      requestAuth,
      setToast,
      connectedProfile: connectedProfile ?? null,
      isAuthenticated: Boolean(connectedProfile?.handle && isAddressAuthorized),
      fetchingProfile,
      receivedProfileProxies,
      activeProfileProxy,
      showWaves,
      isDirectProfileSession,
      sessionUpgradeRequired,
      connectionStatus: getProfileConnectedStatus({
        profile: connectedProfile ?? null,
        isProxy: !!activeProfileProxy,
      }),
      requestSessionUpgrade,
      requestSignedMessagesGrant,
      ensureActiveSessionV2WebSession,
      setActiveProfileProxy,
    }),
    [
      activeProfileProxy,
      connectedProfile,
      ensureActiveSessionV2WebSession,
      fetchingProfile,
      isAddressAuthorized,
      isDirectProfileSession,
      receivedProfileProxies,
      requestAuth,
      requestSessionUpgrade,
      requestSignedMessagesGrant,
      sessionUpgradeRequired,
      setActiveProfileProxy,
      setToast,
      showWaves,
    ]
  );
}
