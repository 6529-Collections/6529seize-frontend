"use client";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams } from "next/navigation";
import { useContext } from "react";
import UserPageDrops from "./UserPageDrops";

export default function UserPageBrainWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const user = (params["user"] as string).toLowerCase();

  const { showWaves } = useContext(AuthContext);

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  if (!showWaves) {
    return <div className="tw-min-h-screen" />;
  }

  return <UserPageDrops profile={profile ?? initialProfile} />;
}
