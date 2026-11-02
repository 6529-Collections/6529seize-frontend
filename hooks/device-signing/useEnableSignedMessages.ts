"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  SignedMessagesEnableFlow,
  type SignedMessagesEnableSnapshot,
  type SignedMessagesEnableStatus,
} from "@/components/device-signing/signedMessagesEnableFlow";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { reportSignedMessagesEnable } from "@/utils/monitoring/signedMessagesEnableMonitoring";
import { useEffect, useMemo, useState } from "react";
import { useSignedMessagesWallet } from "./useSignedMessagesWallet";

/**
 * "Turn on signed messages" (and Renew): one click gets the user to the one
 * wallet signature. Without a live wallet it opens the wallet connection and
 * continues once connected; `status` says what is happening or what failed.
 */
export function useEnableSignedMessages() {
  const locale = useBrowserLocale();
  const { requestSignedMessagesGrant, setToast } = useAuth();
  const {
    address,
    canSignActiveWallet,
    connectedAccounts,
    isWalletConnectionPending,
    seizeConnectFresh,
    seizeConnectOpen,
  } = useSeizeConnectContext();
  const { isRemoteWallet, networkName, isNetworkSupported, switchNetwork } =
    useSignedMessagesWallet();
  const [status, setStatus] = useState<SignedMessagesEnableStatus | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);
  // One flow per mounted control; it only calls the stable state setters.
  const flow = useMemo(
    () =>
      new SignedMessagesEnableFlow({
        setStatus,
        setBusy: setIsEnabling,
        report: reportSignedMessagesEnable,
      }),
    []
  );
  const hasOtherLiveAccount = connectedAccounts.some(
    (account) => account.isConnected && !account.isActive
  );

  const snapshot = useMemo(
    (): SignedMessagesEnableSnapshot => ({
      address,
      canSignActiveWallet: canSignActiveWallet === true,
      isWalletConnectionPending: isWalletConnectionPending === true,
      isConnectOpen: seizeConnectOpen === true,
      hasOtherLiveAccount,
      isRemoteWallet,
      requestGrant: requestSignedMessagesGrant,
      connectWallet: seizeConnectFresh,
      networkName,
      isNetworkSupported,
      switchNetwork,
      onEnabled: () =>
        setToast({
          message: t(locale, "signedMessages.notice.enabled"),
          type: "success",
        }),
    }),
    [
      address,
      canSignActiveWallet,
      hasOtherLiveAccount,
      isNetworkSupported,
      isRemoteWallet,
      isWalletConnectionPending,
      locale,
      networkName,
      requestSignedMessagesGrant,
      seizeConnectFresh,
      seizeConnectOpen,
      setToast,
      switchNetwork,
    ]
  );

  useEffect(() => {
    flow.update(snapshot);
  }, [flow, snapshot]);
  useEffect(() => () => flow.dispose(), [flow]);

  return {
    canEnable: requestSignedMessagesGrant !== undefined,
    enable: flow.enable,
    reconnect: flow.reconnect,
    isEnabling,
    status,
  };
}
