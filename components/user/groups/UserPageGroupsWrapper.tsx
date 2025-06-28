"use client";

import { useRouter } from "next/router";

import UserPageGroups from "./UserPageGroups";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import { useIdentity } from "../../../hooks/useIdentity";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
export default function UserPageGroupsWrapper({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

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
