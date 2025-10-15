"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import UserPageSetUpProfile from "./UserPageSetUpProfile";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";

export default function UserPageSetUpProfileWrapper({
  profile,
  children,
  handleOrWallet,
}: {
  readonly profile: ApiIdentity;
  readonly children: ReactNode;
  readonly handleOrWallet?: string;
}) {
  const { address } = useSeizeConnectContext();

  const normalizedHandleOrWallet = useMemo(() => {
    if (handleOrWallet) return handleOrWallet.toLowerCase();
    if (profile?.handle) return profile.handle.toLowerCase();
    return profile?.wallets?.[0]?.wallet?.toLowerCase() ?? null;
  }, [handleOrWallet, profile]);

  const { profile: hydratedProfile } = useIdentity({
    handleOrWallet: normalizedHandleOrWallet,
    initialProfile: profile,
  });

  const resolvedProfile = hydratedProfile ?? profile;

  const getShowSetUpProfile = () => {
    if (!address) return false;
    if (!resolvedProfile) return false;
    if (resolvedProfile.handle) return false;
    return !!resolvedProfile.wallets?.find((w) =>
      [w.wallet.toLowerCase(), w.display?.toLowerCase()].includes(
        address.toLowerCase()
      )
    );
  };

  const [showSetUpProfile, setShowSetUpProfile] = useState<boolean>(
    getShowSetUpProfile()
  );

  useEffect(
    () => setShowSetUpProfile(getShowSetUpProfile()),
    [resolvedProfile, address]
  );

  if (showSetUpProfile) {
    return <UserPageSetUpProfile profile={resolvedProfile} />;
  }
  return <>{children}</>;
}
