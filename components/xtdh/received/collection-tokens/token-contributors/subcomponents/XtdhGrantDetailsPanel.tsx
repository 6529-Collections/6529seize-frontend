import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { GrantedListSkeleton } from "@/components/user/xtdh/granted-list/subcomponents/GrantedListSkeleton";
import { GrantedListError } from "@/components/user/xtdh/granted-list/subcomponents/GrantedListError";
import ProfileBadge from "@/components/common/profile/ProfileBadge";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { cicToType, formatNumberWithCommas as formatNumber } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";
import { formatXtdhRate } from "@/components/xtdh/received/utils/formatters";
import { StatusBadge } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/subcomponents/StatusBadge";

interface XtdhGrantDetailsPanelProps {
  readonly grantId: string;
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) {
    return "N/A";
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function XtdhGrantDetailsPanel({
  grantId,
}: Readonly<XtdhGrantDetailsPanelProps>) {
  const { grant, isLoading, isError, errorMessage, refetch } = useXtdhGrantQuery({
    grantId,
  });

  if (isLoading) {
    return <GrantedListSkeleton />;
  }

  if (isError || !grant) {
    return (
      <GrantedListError
        message={errorMessage ?? "Failed to load grant details."}
        onRetry={() => refetch()}
      />
    );
  }

  const grantor = grant.grantor;
  const grantorHandle = grantor.handle;
  const displayHandle =
    grantorHandle ?? shortenAddress(grantor.primary_address) ?? "Unknown grantor";
  const profileHref = grantorHandle ? `/${grantorHandle}` : undefined;
  const tooltipIdentity = grantorHandle ?? grantor.primary_address ?? "";

  const avatarFallback = (
    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-400">
      ?
    </div>
  );

  const grantorBadge = (
    <ProfileBadge
      handle={displayHandle}
      href={profileHref}
      pfpUrl={grantor.pfp}
      level={grantor.level ?? 0}
      cicType={cicToType(grantor.cic ?? 0)}
      avatarFallback={avatarFallback}
      asLink={Boolean(profileHref)}
      avatarAlt={grantorHandle ?? "Grantor profile"}
    />
  );

  return (
    <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-6 tw-space-y-6">
      <div className="tw-flex tw-flex-col tw-gap-6 md:tw-flex-row md:tw-items-start md:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-xl tw-bg-iron-900">
            {tooltipIdentity ? (
              <UserProfileTooltipWrapper user={tooltipIdentity}>
                {grantorBadge}
              </UserProfileTooltipWrapper>
            ) : (
              grantorBadge
            )}
          </div>
          <div>
            <div className="tw-text-sm tw-font-medium tw-text-iron-400">
              Grantor
            </div>
            <div className="tw-text-lg tw-font-semibold tw-text-iron-100">
              {displayHandle}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <StatusBadge
            status={grant.status}
            validFrom={grant.valid_from}
            validTo={grant.valid_to}
          />
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 tw-gap-6 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-border-t tw-border-iron-800 tw-pt-6">
        <div>
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1">
            Target Tokens
          </div>
          <div className="tw-text-lg tw-font-medium tw-text-iron-100">
            {formatNumber(grant.target_tokens_count)}
          </div>
        </div>

        <div>
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1">
            xTDH Rate
          </div>
          <div className="tw-text-lg tw-font-medium tw-text-iron-100">
            {formatXtdhRate(grant.tdh_rate)}
            <span className="tw-text-sm tw-text-iron-500 tw-ml-1">/ day</span>
          </div>
        </div>

        <div>
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1">
            Valid From
          </div>
          <div className="tw-text-lg tw-font-medium tw-text-iron-100">
            {formatDate(grant.valid_from)}
          </div>
        </div>

        <div>
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1">
            Valid To
          </div>
          <div className="tw-text-lg tw-font-medium tw-text-iron-100">
            {grant.valid_to ? formatDate(grant.valid_to) : "Indefinite"}
          </div>
        </div>
      </div>
    </div>
  );
}
