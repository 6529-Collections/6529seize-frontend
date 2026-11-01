"use client";

import { useEffect } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { prefetchLoginE2eeDevice } from "@/lib/device-signing/login-e2ee";

/**
 * NC8: a sign-in is coming when the wallet modal is open or a wallet is
 * connected without a valid sign-in. Loading the MLS module then lets that
 * sign-in grant the encrypted-messages key with its one signature instead
 * of running out of its time budget.
 */
export function useLoginE2eePrefetch(): void {
  const { seizeConnectOpen, isConnected, hasValidWalletAuth } =
    useSeizeConnectContext();
  const signInAhead =
    seizeConnectOpen === true ||
    (isConnected === true && hasValidWalletAuth === false);
  useEffect(() => {
    if (signInAhead) {
      prefetchLoginE2eeDevice();
    }
  }, [signInAhead]);
}
