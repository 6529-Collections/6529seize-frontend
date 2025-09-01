"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import UserPageWaves from "./UserPageWaves";
export default function UserPageWavesWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const router = useRouter();
  const user = (params?.user as string)?.toLowerCase();

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
