"use client";

import { useMemo } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useIsDropForgeAdmin } from "@/hooks/useIsDropForgeAdmin";

export function useDropForgePermissions() {
  const { address, connectionState } = useSeizeConnectContext();
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const distributionAdminWalletsKey = JSON.stringify(
    seizeSettings.distribution_admin_wallets ?? []
  );
  const claimsAdminWalletsKey = JSON.stringify(
    seizeSettings.claims_admin_wallets ?? []
  );
  const distributionAdminWallets = useMemo(
    () => JSON.parse(distributionAdminWalletsKey) as string[],
    [distributionAdminWalletsKey]
  );
  const claimsAdminWallets = useMemo(
    () => JSON.parse(claimsAdminWalletsKey) as string[],
    [claimsAdminWalletsKey]
  );
  const {
    isDropForgeAdmin,
    isFetching: isDropForgeAdminFetching,
  } = useIsDropForgeAdmin();

  return useMemo(() => {
    const hasWallet = !!address;
    const isWalletInitializing = connectionState === "initializing";
    const permissionsLoading =
      isWalletInitializing ||
      (hasWallet && !isLoaded) ||
      (hasWallet && isDropForgeAdminFetching);
    const isDistributionAdmin =
      hasWallet &&
      distributionAdminWallets.some((w) => areEqualAddresses(w, address));
    const isClaimsAdmin =
      hasWallet &&
      claimsAdminWallets.some((w) => areEqualAddresses(w, address));
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
  }, [
    address,
    connectionState,
    isLoaded,
    isDropForgeAdmin,
    isDropForgeAdminFetching,
    distributionAdminWallets,
    claimsAdminWallets,
  ]);
}
