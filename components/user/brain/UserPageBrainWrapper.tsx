"use client";

import { useRouter } from "next/router";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import UserPageDrops from "./UserPageDrops";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../auth/Auth";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { useIdentity } from "../../../hooks/useIdentity";
export default function UserPageBrainWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { address } = useSeizeConnectContext();
  const { connectedProfile, activeProfileProxy, showWaves } =
    useContext(AuthContext);

  useEffect(() => {
    if (showWaves) {
      return;
    }
    if (connectedProfile || !address) {
      router.push(`/${user}/rep`);
    }
  }, [connectedProfile, activeProfileProxy, address, showWaves]);

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  if (!showWaves) {
    return null;
  }

  return <UserPageDrops profile={profile} />;
}
