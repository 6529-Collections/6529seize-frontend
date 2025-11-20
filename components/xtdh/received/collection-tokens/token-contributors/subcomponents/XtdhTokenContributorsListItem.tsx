import ProfileBadge from "@/components/common/profile/ProfileBadge";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { cicToType } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";
import type { ApiXTdhContribution } from "@/generated/models/ApiXTdhContribution";

import { formatXtdhRate, formatXtdhValue } from "../../../utils/formatters";
import { XtdhRatePill } from "../../../collection-card-content/subcomponents/XtdhRatePill";

interface XtdhTokenContributorsListItemProps {
  /**
   * Contribution row which either references a specific grant (flat view)
   * or represents a group of grants for a given grantor.
   */
  readonly contribution: ApiXTdhContribution;
}

export function XtdhTokenContributorsListItem({
  contribution,
}: Readonly<XtdhTokenContributorsListItemProps>) {
  const xtdhValue = formatXtdhValue(contribution.xtdh);
  const xtdhRateValue = formatXtdhRate(contribution.xtdh_rate);
  const grantor = contribution.grant?.grantor ?? contribution.grantor ?? null;
  const grantorHandle = grantor?.handle ?? null;
  const tooltipIdentity = grantorHandle ?? grantor?.id ?? "";
  const displayHandle =
    grantorHandle ?? shortenAddress(grantor?.primary_address) ?? "Unknown grantor";
  const profileHref = grantorHandle ? `/${grantorHandle}` : undefined;

  const avatarFallback = (
    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-400">
      ?
    </div>
  );

  const grantorBadge = (
    <ProfileBadge
      handle={displayHandle}
      href={profileHref}
      pfpUrl={grantor?.pfp}
      level={grantor?.level ?? 0}
      cicType={cicToType(grantor?.cic ?? 0)}
      avatarFallback={avatarFallback}
      asLink={Boolean(profileHref)}
      avatarAlt={grantorHandle ?? "Grantor profile"}
    />
  );

  const grantorSummary = tooltipIdentity ? (
    <UserProfileTooltipWrapper user={tooltipIdentity}>
      {grantorBadge}
    </UserProfileTooltipWrapper>
  ) : (
    grantorBadge
  );

  return (
    <li className="tw-list-none tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-1">
            {grantorSummary}
          </div>
        </div>
        <XtdhRatePill
          rateLabel={xtdhRateValue}
          totalLabel={xtdhValue}
          className="tw-justify-start lg:tw-justify-end lg:tw-w-[280px]"
        />
      </div>
    </li>
  );
}
