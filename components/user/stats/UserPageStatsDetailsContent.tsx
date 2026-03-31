"use client";

import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageActivityWrapper from "./activity/UserPageActivityWrapper";
import UserPageStatsActivityOverview from "./UserPageStatsActivityOverview";
import UserPageStatsBoostBreakdown from "./UserPageStatsBoostBreakdown";
import UserPageStatsCollected from "./UserPageStatsCollected";

export default function UserPageStatsDetailsContent({
  profile,
  activeAddress,
  seasons,
  tdh,
  ownerBalance,
  balanceMemes,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly seasons: MemeSeason[];
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
}) {
  return (
    <div className="tw-mt-4">
      <UserPageStatsCollected
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
        seasons={seasons}
      />

      <UserPageStatsActivityOverview
        profile={profile}
        activeAddress={activeAddress}
      />

      <UserPageActivityWrapper
        profile={profile}
        activeAddress={activeAddress}
      />

      <UserPageStatsBoostBreakdown tdh={tdh} />
    </div>
  );
}
