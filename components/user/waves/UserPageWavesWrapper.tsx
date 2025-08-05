"use client";

import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import { useIdentity } from "../../../hooks/useIdentity";
import { AuthContext } from "../../auth/Auth";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import UserPageWaves from "./UserPageWaves";
export default function UserPageWavesWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { address } = useSeizeConnectContext();
  const { connectedProfile, activeProfileProxy, showWaves, fetchingProfile } =
    useContext(AuthContext);

  useEffect(() => {
    if (fetchingProfile) {
      return;
    }
    if (!connectedProfile || !address || !showWaves) {
      router.push(`/${user}/rep`);
    }
  }, [
    connectedProfile,
    activeProfileProxy,
    address,
    showWaves,
    fetchingProfile,
  ]);

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  if (!showWaves) {
    return null;
  }

  return <UserPageWaves profile={profile ?? initialProfile} />;
}
