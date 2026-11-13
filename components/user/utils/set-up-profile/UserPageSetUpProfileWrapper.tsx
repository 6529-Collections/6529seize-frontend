"use client";

import type { ReactNode } from "react";
import { useHasHydrated } from "@/hooks/useHasHydrated";

import UserPageSetUpProfile from "./UserPageSetUpProfile";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageSetUpProfileWrapper({
  profile,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly children: ReactNode;
}) {
  const { address } = useSeizeConnectContext();
  const hasHydrated = useHasHydrated();

  const getShowSetUpProfile = () => {
    if (!address) return false;
    if (!profile) return false;
    if (profile.handle) return false;
    return !!profile.wallets?.find((w) =>
      [w.wallet.toLowerCase(), w.display?.toLowerCase()].includes(
        address.toLowerCase()
      )
    );
  };

  if (hasHydrated && getShowSetUpProfile()) {
    return <UserPageSetUpProfile profile={profile} />;
  }
  return <>{children}</>;
}
