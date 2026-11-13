"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function useHomeWalletConnect() {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { seizeConnectFresh, seizeConnectOpen } = useSeizeConnectContext();
  const [isOpeningWallet, setIsOpeningWallet] = useState(false);
  const isConnectBusy = isOpeningWallet || seizeConnectOpen;

  const handleConnect = async (): Promise<void> => {
    setIsOpeningWallet(true);
    try {
      await seizeConnectFresh();
    } catch (error) {
      console.error("Failed to open wallet connection", error);
      setToast({
        message: t(locale, "home.newcomer.connectFailed"),
        type: "error",
      });
    } finally {
      setIsOpeningWallet(false);
    }
  };

  return { isConnectBusy, handleConnect };
}
