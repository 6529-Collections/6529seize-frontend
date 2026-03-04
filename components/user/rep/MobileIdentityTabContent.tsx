import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ApiCicOverview } from "@/generated/models/ApiCicOverview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { RateMatter } from "@/types/enums";
import { FingerprintIcon } from "../identity/header/RateNicCta";
import UserPageIdentityStatementsAddButton from "../identity/statements/add/UserPageIdentityStatementsAddButton";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";
import UserPageRateWrapper from "../utils/rate/UserPageRateWrapper";
import UserPageCombinedActivityLog from "./UserPageCombinedActivityLog";

export default function MobileIdentityTabContent({
  profile,
  cicOverview,
  initialActivityLogParams,
  canEditNic,
  canEditStatements,
  onRateNic,
}: {
  readonly profile: ApiIdentity;
  readonly cicOverview: ApiCicOverview | null;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly canEditNic: boolean;
  readonly canEditStatements: boolean;
  readonly onRateNic: () => void;
}) {
  return (
    <>
      {/* Rate NIC CTA */}
      {canEditNic && (
        <div className="tw-mt-4">
          <UserPageRateWrapper
            profile={profile}
            type={RateMatter.NIC}
            hideOwnProfileMessage
          >
            <div className="tw-flex tw-items-center tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-emerald-500/20 tw-bg-emerald-500/5 tw-px-5 tw-py-3">
              {cicOverview !== null && cicOverview.authenticated_user_contribution !== null &&
              cicOverview.authenticated_user_contribution !== 0 ? (
                <span className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-500">
                  <FingerprintIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-emerald-400" />
                  Your Rate:{" "}
                  <span
                    className={`tw-font-semibold ${cicOverview.authenticated_user_contribution >= 0 ? "tw-text-emerald-400" : "tw-text-rose-400"}`}
                  >
                    {formatNumberWithCommas(
                      cicOverview.authenticated_user_contribution
                    )}
                  </span>
                </span>
              ) : (
                <span className="tw-text-xs tw-font-medium tw-text-emerald-200/70">
                  Verify this identity
                </span>
              )}
              <button
                onClick={onRateNic}
                className="tw-flex tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500 tw-bg-emerald-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-zinc-950 tw-transition tw-duration-300 tw-ease-out hover:tw-border-emerald-400 hover:tw-bg-emerald-400"
              >
                Rate NIC
              </button>
            </div>
          </UserPageRateWrapper>
        </div>
      )}

      {/* Identity Statements */}
      <div className="tw-mt-6 tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-100">
          ID Statements
        </h3>
        {canEditStatements && (
          <UserPageIdentityStatementsAddButton profile={profile} />
        )}
      </div>
      <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0f1014]">
        <UserPageIdentityStatements profile={profile} />
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
