import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import Button from "@/components/utils/button/Button";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { RateMatter } from "@/types/enums";
import { useMemo } from "react";
import { FingerprintIcon } from "../identity/header/RateNicCta";
import UserCICStatus from "../utils/user-cic-status/UserCICStatus";
import UserCICTypeIcon from "../utils/user-cic-type/UserCICTypeIcon";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import { buildRepAvatarItems } from "./buildRepAvatarItems";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";

export default function MobileNicTabContent({
  profile,
  cicOverview,
  initialActivityLogParams,
  canEditNic,
  onRateNic,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly canEditNic: boolean;
  readonly onRateNic: () => void;
}) {
  const cic = cicOverview?.total_cic ?? profile.cic;
  const contributorCount = cicOverview?.contributor_count ?? 0;
  const cicAvatarItems = useMemo(
    () =>
      buildRepAvatarItems(cicOverview?.contributors.data ?? [], 3, {
        omitHref: true,
      }),
    [cicOverview?.contributors.data]
  );

  return (
    <>
      <div className="tw-mt-4 tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-px-1 tw-py-1 sm:tw-grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:tw-gap-x-6">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
          <span className="tw-h-4 tw-w-4 tw-flex-shrink-0">
            <UserCICTypeIcon cic={cic} />
          </span>
          <span className="tw-text-pretty tw-text-xs tw-font-semibold tw-uppercase">
            <UserCICStatus cic={cic} />
          </span>
        </span>

        <span className="tw-col-start-2 tw-row-start-1 tw-flex tw-min-w-0 tw-items-center tw-justify-end tw-gap-2">
          {cicAvatarItems.length > 0 && (
            <span className="tw-pointer-events-none tw-flex-shrink-0 desktop-hover:tw-pointer-events-auto">
              <OverlappingAvatars
                items={cicAvatarItems}
                size="sm"
                maxCount={3}
              />
            </span>
          )}
          <span className="tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400">
            {formatNumberWithCommas(contributorCount)}{" "}
            {contributorCount === 1 ? "rater" : "raters"}
          </span>
        </span>

        {canEditNic && (
          <div className="tw-col-span-2 tw-row-start-2 tw-mt-3 sm:tw-col-span-1 sm:tw-col-start-4 sm:tw-row-start-1 sm:tw-mt-0">
            <UserPageRateWrapper
              profile={profile}
              type={RateMatter.NIC}
              hideOwnProfileMessage
            >
              <div className="tw-flex tw-w-full tw-flex-col tw-items-stretch tw-gap-2 sm:tw-w-auto sm:tw-flex-row sm:tw-items-center sm:tw-gap-3">
                {cicOverview !== null &&
                cicOverview.authenticated_user_contribution !== null &&
                cicOverview.authenticated_user_contribution !== 0 ? (
                  <span className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-500">
                    <FingerprintIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-emerald-400" />
                    Your Rating:{" "}
                    <span className="tw-font-semibold tw-text-iron-300">
                      {cicOverview.authenticated_user_contribution > 0 && "+"}
                      {formatNumberWithCommas(
                        cicOverview.authenticated_user_contribution
                      )}
                    </span>
                  </span>
                ) : null}
                <Button
                  variant="success"
                  size="sm"
                  fullWidth
                  onClick={onRateNic}
                  className="sm:tw-w-auto"
                >
                  Rate NIC
                </Button>
              </div>
            </UserPageRateWrapper>
          </div>
        )}
      </div>

      <div className="tw-mt-6">
        <UserPageCombinedActivityLog
          initialActivityLogParams={initialActivityLogParams}
          matter={RateMatter.NIC}
          withMatterFilter={false}
        />
      </div>
    </>
  );
}
