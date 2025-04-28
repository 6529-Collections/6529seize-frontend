import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import UserPageWaves from "./UserPageWaves";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import { useIdentity } from "../../../hooks/useIdentity";
export default function UserPageWavesWrapper({
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

  return <UserPageWaves profile={profile ?? initialProfile} />;
}
