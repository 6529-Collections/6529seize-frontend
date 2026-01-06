"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { useParams } from "next/navigation";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import UserPageRep from "./UserPageRep";
export default function UserPageRepWrapper({
  profile: initialProfile,
  initialRepReceivedParams,
  initialRepGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialRepReceivedParams: ProfileRatersParams;
  readonly initialRepGivenParams: ProfileRatersParams;
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
        initialRepReceivedParams={initialRepReceivedParams}
        initialRepGivenParams={initialRepGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </UserPageSetUpProfileWrapper>
  );
}
