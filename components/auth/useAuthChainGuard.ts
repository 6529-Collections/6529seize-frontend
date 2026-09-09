"use client";

import { getAccount } from "@wagmi/core";
import { useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import type {
  AuthLoadingState,
  SignModalReason,
} from "@/components/auth/authTypes";

interface SignModalState {
  readonly authLoadingState: AuthLoadingState;
  readonly connectionState: string;
  readonly isConnectionShareUpgradePrompt: boolean;
  readonly isDisconnectedWebSessionUpgradePrompt: boolean;
  readonly isSigningOutAll: boolean;
  readonly showSignModal: boolean;
  readonly signModalReason: SignModalReason;
}

const isSupportedChainId = (
  chainId: number | undefined,
  supportedChains: readonly { readonly id: number }[]
): boolean =>
  typeof chainId === "number" &&
  supportedChains.some((chain) => chain.id === chainId);

export function useAuthChainGuard() {
  const wagmiAccount = useAccount();
  const wagmiConfig = useConfig();
  const isReactiveChainSupported = isSupportedChainId(
    wagmiAccount.chainId,
    wagmiConfig.chains
  );
  const isLatestChainSupported = useCallback(
    (): boolean =>
      isSupportedChainId(getAccount(wagmiConfig).chainId, wagmiConfig.chains),
    [wagmiConfig]
  );

  const shouldShowSignModal = ({
    authLoadingState,
    connectionState,
    isConnectionShareUpgradePrompt,
    isDisconnectedWebSessionUpgradePrompt,
    isSigningOutAll,
    showSignModal,
    signModalReason,
  }: SignModalState): boolean => {
    const isNonSigningSessionUpgradePrompt =
      isConnectionShareUpgradePrompt || isDisconnectedWebSessionUpgradePrompt;
    const canShowForActiveChain =
      isReactiveChainSupported ||
      (isNonSigningSessionUpgradePrompt && !wagmiAccount.isConnected);

    return (
      showSignModal &&
      !isSigningOutAll &&
      !(
        authLoadingState === "validating" &&
        signModalReason !== "session-upgrade"
      ) &&
      (connectionState === "connected" ||
        isDisconnectedWebSessionUpgradePrompt) &&
      canShowForActiveChain
    );
  };

  return { isLatestChainSupported, shouldShowSignModal };
}
