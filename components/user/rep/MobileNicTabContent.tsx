import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import Button from "@/components/utils/button/Button";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatNumber } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const cic = cicOverview?.total_cic ?? profile.cic;
  const contributorCount = cicOverview?.contributor_count ?? 0;
  const contributorCountLabel = t(
    locale,
    new Intl.PluralRules(locale).select(contributorCount) === "one"
      ? "user.profile.rep.contributors.raters.one"
      : "user.profile.rep.contributors.raters.other",
    { count: formatInteger(locale, contributorCount) }
  );
  const cicAvatarItems = useMemo(
    () =>
      buildRepAvatarItems(cicOverview?.contributors.data ?? [], 3, {
        omitHref: true,
      }),
    [cicOverview?.contributors.data]
  );

  return (
    <>
      <div className="tw-mt-4 tw-px-1 tw-py-1">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
          <span className="tw-h-4 tw-w-4 tw-flex-shrink-0">
            <UserCICTypeIcon cic={cic} />
          </span>
          <span className="tw-text-pretty tw-text-xs tw-font-semibold tw-uppercase">
            <UserCICStatus cic={cic} />
          </span>
        </span>

        <div className="tw-mt-3 tw-flex tw-min-h-9 tw-items-center tw-gap-3">
          <span className="tw-flex tw-min-w-0 tw-flex-shrink-0 tw-items-center tw-gap-2">
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
              {contributorCountLabel}
            </span>
          </span>

          {canEditNic && (
            <div className="tw-ml-auto tw-flex tw-min-w-0 tw-items-center">
              <UserPageRateWrapper
                profile={profile}
                type={RateMatter.NIC}
                hideOwnProfileMessage
              >
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-start tw-gap-2 sm:tw-flex-nowrap sm:tw-justify-end sm:tw-gap-3">
                  {cicOverview !== null &&
                  cicOverview.authenticated_user_contribution !== null &&
                  cicOverview.authenticated_user_contribution !== 0 ? (
                    <span className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-500">
                      <FingerprintIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-emerald-400" />
                      {tRich(locale, "user.profile.rep.nic.yourRating", {
                        value: (
                          <span className="tw-font-semibold tw-text-iron-300">
                            {formatNumber(
                              locale,
                              cicOverview.authenticated_user_contribution,
                              {
                                maximumFractionDigits: 0,
                                signDisplay: "exceptZero",
                              }
                            )}
                          </span>
                        ),
                      })}
                    </span>
                  ) : null}
                  <Button variant="success" size="sm" onClick={onRateNic}>
                    {t(locale, "user.profile.rep.nic.rateAction")}
                  </Button>
                </div>
              </UserPageRateWrapper>
            </div>
          )}
        </div>
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
