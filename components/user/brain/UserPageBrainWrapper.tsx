"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import UserPageDrops from "./UserPageDrops";

export default function UserPageBrainWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const router = useRouter();
  const user = (params?.user as string)?.toLowerCase();

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
