import UserPageStatsDetailsContent from "@/components/user/stats/UserPageStatsDetailsContent";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";

interface CollectedStatsDetailsPanelProps {
  readonly isOpen: boolean;
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

/** Reveals the existing detailed statistics content beneath the summary. */
export function CollectedStatsDetailsPanel({
  isOpen,
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
  const unavailableMessage = translate(
    locale,
    "user.collected.stats.details.unavailable"
  );

  return (
    <CommonAnimationHeight>
      <div id={detailsId}>
        {isOpen && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-black tw-px-4 tw-pb-5 tw-pt-4 sm:tw-px-6 sm:tw-pb-6 sm:tw-pt-5">
            {statsPath === null ? (
              <div className="tw-py-2 tw-text-sm tw-text-iron-400">
                {unavailableMessage}
              </div>
            ) : (
              <UserPageStatsDetailsContent
                profile={profile}
                activeAddress={activeAddress}
                seasons={seasons}
                tdh={tdh}
                ownerBalance={ownerBalance}
                balanceMemes={balanceMemes}
                locale={locale}
              />
            )}
          </div>
        )}
      </div>
    </CommonAnimationHeight>
  );
}
