"use client";

import UserPageRateWrapper from "@/components/user/utils/rate/UserPageRateWrapper";
import { RateMatter } from "@/enums";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import dynamic from "next/dynamic";

const UserPageIdentityHeaderCICRate = dynamic(
  () => import("./cic-rate/UserPageIdentityHeaderCICRate"),
  { ssr: false }
);

export default function UserPageIdentityHeaderActionsClient({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <UserPageRateWrapper profile={profile} type={RateMatter.NIC}>
      <UserPageIdentityHeaderCICRate profile={profile} isTooltip={false} />
    </UserPageRateWrapper>
  );
}
