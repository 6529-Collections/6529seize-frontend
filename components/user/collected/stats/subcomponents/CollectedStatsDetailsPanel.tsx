import UserPageStatsDetailsContent from "@/components/user/stats/UserPageStatsDetailsContent";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";

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
}

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
}: Readonly<CollectedStatsDetailsPanelProps>) {
  return (
    <CommonAnimationHeight>
      <div id={detailsId}>
        {isOpen && (
          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/90 tw-bg-gradient-to-b tw-from-iron-900/30 tw-to-transparent tw-px-4 tw-pb-5 sm:tw-px-6 sm:tw-pb-6">
            {statsPath === null ? (
              <div className="tw-py-2 tw-text-sm tw-text-iron-400">
                Stats are unavailable for this profile.
              </div>
            ) : (
              <UserPageStatsDetailsContent
                profile={profile}
                activeAddress={activeAddress}
                seasons={seasons}
                tdh={tdh}
                ownerBalance={ownerBalance}
                balanceMemes={balanceMemes}
              />
            )}
          </div>
        )}
      </div>
    </CommonAnimationHeight>
  );
}
