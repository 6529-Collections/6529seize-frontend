"use client";

import { useParams } from "next/navigation";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "../../../hooks/useIdentity";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import UserPageGroups from "./UserPageGroups";
export default function UserPageGroupsWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const params = useParams();
  const user = (params?.user as string)?.toLowerCase();

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  return (
    <UserPageSetUpProfileWrapper profile={profile ?? initialProfile}>
      <UserPageGroups profile={profile} />
    </UserPageSetUpProfileWrapper>
  );
}
