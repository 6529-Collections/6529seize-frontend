"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useIsMemesAdmin } from "@/hooks/useIsMemesAdmin";
import { useMemo } from "react";

export function useDropControlPermissions() {
  const { address } = useSeizeConnectContext();
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const isMemesAdmin = useIsMemesAdmin();

  return useMemo(() => {
    const hasWallet = !!address;
    const permissionsLoading = hasWallet && !isLoaded;
    const isDistributionAdmin = hasWallet &&
      seizeSettings.distribution_admin_wallets.some((w) =>
        areEqualAddresses(w, address)
      );
    const isClaimsAdmin = hasWallet &&
      seizeSettings.claims_admin_wallets.some((w) =>
        areEqualAddresses(w, address)
      );
    const canLaunch = hasWallet && (isClaimsAdmin || isMemesAdmin);
    const canAccessLanding = hasWallet && (isDistributionAdmin || isClaimsAdmin || isMemesAdmin);
    const canAccessPrepare = isDistributionAdmin;
    const canAccessLaunchPage = canLaunch;

    return {
      hasWallet,
      permissionsLoading,
      canAccessLanding,
      canAccessPrepare,
      canAccessLaunch: canLaunch,
      canAccessLaunchPage,
      isDistributionAdmin,
      isClaimsAdmin,
      isMemesAdmin,
    };
  }, [address, isLoaded, isMemesAdmin, seizeSettings]);
}
