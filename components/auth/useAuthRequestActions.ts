import { createAuthRequestActions } from "./authActions";
import { useAppGrantSigner } from "./useAppGrantSigner";
import type { CreateAuthRequestActionsParams } from "./authActionTypes";
import { useSeizeConnectContext } from "./SeizeConnectContext";
import { useProfileProxySwitch } from "./useProfileProxySwitch";
import { getWalletAddress } from "@/services/auth/auth.utils";

export function useAuthRequestActions(
  params: Omit<CreateAuthRequestActionsParams, "seizeConnect" | "signAppGrant">
) {
  const { seizeConnect } = useSeizeConnectContext();
  const signAppGrant = useAppGrantSigner();
  const actions = createAuthRequestActions({
    ...params,
    seizeConnect,
    signAppGrant,
  });
  const signedInAddress = getWalletAddress() ?? params.address;
  const onActiveProfileProxy = useProfileProxySwitch({
    activeProxyId: params.activeProfileProxy?.id ?? null,
    canSignActiveWallet: params.canSignActiveWallet,
    contextFingerprint: `${signedInAddress?.toLowerCase() ?? ""}:${params.activeProfileProxy?.id ?? ""}`,
    enableWalletAuthentication: params.enableWalletAuthentication,
    onSwitch: actions.onActiveProfileProxy,
    setToast: params.setToast,
  });
  return { ...actions, onActiveProfileProxy };
}
