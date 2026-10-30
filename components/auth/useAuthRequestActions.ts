import { createAuthRequestActions } from "./authActions";
import type { CreateAuthRequestActionsParams } from "./authActionTypes";
import { useSeizeConnectContext } from "./SeizeConnectContext";
import { useProfileProxySwitch } from "./useProfileProxySwitch";

export function useAuthRequestActions(
  params: Omit<CreateAuthRequestActionsParams, "seizeConnect">
) {
  const { seizeConnect } = useSeizeConnectContext();
  const actions = createAuthRequestActions({ ...params, seizeConnect });
  const onActiveProfileProxy = useProfileProxySwitch({
    activeProxyId: params.activeProfileProxy?.id ?? null,
    canSignActiveWallet: params.canSignActiveWallet,
    contextFingerprint: `${params.address?.toLowerCase() ?? ""}:${params.activeProfileProxy?.id ?? ""}`,
    enableWalletAuthentication: params.enableWalletAuthentication,
    onSwitch: actions.onActiveProfileProxy,
    setToast: params.setToast,
  });
  return { ...actions, onActiveProfileProxy };
}
