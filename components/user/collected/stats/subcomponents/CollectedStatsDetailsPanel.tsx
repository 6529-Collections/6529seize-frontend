import UserPageStatsDetailsContent from "@/components/user/stats/UserPageStatsDetailsContent";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";

interface CollectedStatsDetailsPanelProps {
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly detailsId: string;
  readonly statsPath: string | null;
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly seasons: MemeSeason[];
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
  readonly locale: SupportedLocale;
}

export function CollectedStatsDetailsPanel({
  isOpen,
  isLoading,
  detailsId,
  statsPath,
  profile,
  activeAddress,
  seasons,
  tdh,
  ownerBalance,
  balanceMemes,
  locale,
}: Readonly<CollectedStatsDetailsPanelProps>) {
  let content;
  if (statsPath === null) {
    content = (
      <div className="tw-py-2 tw-text-[15px]/5 tw-font-normal tw-text-iron-300">
        {translate(locale, "user.collected.stats.details.unavailable")}
      </div>
    );
  } else if (isLoading) {
    content = (
      <div role="status" className="tw-py-6 tw-text-sm tw-text-iron-400">
        {translate(locale, "user.collected.stats.details.loading")}
      </div>
    );
  } else {
    content = (
      <UserPageStatsDetailsContent
        profile={profile}
        activeAddress={activeAddress}
        seasons={seasons}
        tdh={tdh}
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
        locale={locale}
      />
    );
  }

  return (
    <div id={detailsId} data-profile-section="Collection details">
      {isOpen && (
        <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/90 tw-bg-gradient-to-b tw-from-iron-900/50 tw-via-iron-950/40 tw-to-black tw-px-3 tw-pb-3 tw-pt-3 tw-ring-1 tw-ring-inset tw-ring-white/[0.04] md:tw-px-6 md:tw-pb-6 md:tw-pt-5">
          {content}
        </div>
      )}
    </div>
  );
}
