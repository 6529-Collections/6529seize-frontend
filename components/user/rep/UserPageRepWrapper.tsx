"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams } from "next/navigation";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import UserPageRep from "./UserPageRep";
export default function UserPageRepWrapper({
  profile: initialProfile,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const params = useParams();
  const user = (params?.["user"] as string)?.toLowerCase();

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile,
  });

  return (
    <UserPageSetUpProfileWrapper profile={profile ?? initialProfile}>
      <UserPageRep
        profile={profile ?? initialProfile}
        initialActivityLogParams={initialActivityLogParams}
      />
    </UserPageSetUpProfileWrapper>
  );
}
