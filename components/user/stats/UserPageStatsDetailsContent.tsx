"use client";

import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { SupportedLocale } from "@/i18n/locales";
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
  locale,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly seasons: MemeSeason[];
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-mt-6 tw-space-y-8 lg:tw-mt-8 lg:tw-space-y-10">
      <UserPageStatsCollected
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
        seasons={seasons}
        locale={locale}
      />

      <UserPageStatsActivityOverview
        profile={profile}
        activeAddress={activeAddress}
        locale={locale}
      />

      <UserPageActivityWrapper
        profile={profile}
        activeAddress={activeAddress}
        locale={locale}
      />

      <UserPageStatsBoostBreakdown tdh={tdh} locale={locale} />
    </div>
  );
}
