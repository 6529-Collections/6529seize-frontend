"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useIsDropForgeAdmin } from "@/hooks/useIsDropForgeAdmin";
import { useMemo } from "react";

export function useDropForgePermissions() {
  const { address, connectionState } = useSeizeConnectContext();
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const isDropForgeAdmin = useIsDropForgeAdmin();

  return useMemo(() => {
    const hasWallet = !!address;
    const isWalletInitializing = connectionState === "initializing";
    const permissionsLoading =
      isWalletInitializing || (hasWallet && !isLoaded);
    const isDistributionAdmin =
      hasWallet &&
      seizeSettings.distribution_admin_wallets.some((w) =>
        areEqualAddresses(w, address)
      );
    const isClaimsAdmin =
      hasWallet &&
      seizeSettings.claims_admin_wallets.some((w) =>
        areEqualAddresses(w, address)
      );
    const canLaunch = hasWallet && (isClaimsAdmin || isDropForgeAdmin);
    const canAccessLanding =
      hasWallet && (isDistributionAdmin || isClaimsAdmin || isDropForgeAdmin);
    const canAccessCraft = isDistributionAdmin;
    const canAccessLaunchPage = canLaunch;

    return {
      hasWallet,
      permissionsLoading,
      canAccessLanding,
      canAccessCraft,
      canAccessLaunch: canLaunch,
      canAccessLaunchPage,
      isDistributionAdmin,
      isClaimsAdmin,
      isDropForgeAdmin,
    };
  }, [address, connectionState, isLoaded, isDropForgeAdmin, seizeSettings]);
}
