"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserStatsRow from "../../utils/stats/UserStatsRow";


const SAFE_ROUTE_SEGMENT_PATTERN = /^[a-zA-Z0-9._-]+$/;

function sanitizeRouteSegment(value: string): string | null {
  if (!value) {
    return null;
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }
  const normalizedValue = trimmedValue.toLowerCase();
  if (!SAFE_ROUTE_SEGMENT_PATTERN.test(normalizedValue)) {
    return null;
  }
  return encodeURIComponent(normalizedValue);
}

export default function UserPageHeaderStats({
  profile,
  handleOrWallet,
  followersCount,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly followersCount: number | null;
}) {
  const routeHandle = sanitizeRouteSegment(handleOrWallet);

  if (!routeHandle) {
    return null;
  }

  return (
    <div className="tw-w-full">
      <UserStatsRow
        handle={routeHandle}
        tdh={profile.tdh}
        tdh_rate={profile.tdh_rate}
        xtdh={profile.xtdh}
        xtdh_rate={profile.xtdh_rate}
        rep={profile.rep}
        cic={profile.cic}
        followersCount={followersCount}
      />
    </div>
  );
}
