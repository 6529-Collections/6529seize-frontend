import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
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
      <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.02] tw-px-3 tw-py-2.5">
        <div>
          <h2 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            Network Identity Check (NIC)
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-500">
            Does the network believe this profile accurately represents its
            identity?
          </p>
        </div>

        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
            <span className="tw-h-4 tw-w-4 tw-flex-shrink-0">
              <UserCICTypeIcon cic={cic} />
            </span>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-emerald-400">
              <UserCICStatus cic={cic} />
            </span>
          </span>

          <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
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
        </div>
      </div>

      {canEditNic && (
        <div className="tw-mt-4">
          <UserPageRateWrapper
            profile={profile}
            type={RateMatter.NIC}
            hideOwnProfileMessage
          >
            <div className="tw-flex tw-w-full tw-flex-col tw-items-stretch tw-gap-2 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-3">
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
              <button
                type="button"
                onClick={onRateNic}
                className="tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-600 tw-bg-emerald-600 tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-white tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-emerald-700 desktop-hover:hover:tw-bg-emerald-500 motion-reduce:tw-transition-none md:tw-min-h-0 md:tw-w-auto md:tw-flex-shrink-0 md:tw-py-1.5"
              >
                Rate NIC
              </button>
            </div>
          </UserPageRateWrapper>
        </div>
      )}

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
