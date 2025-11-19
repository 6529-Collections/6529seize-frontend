import Image from "next/image";
import Link from "next/link";

import UserCICTypeIcon from "@/components/user/utils/user-cic-type/UserCICTypeIcon";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";
import type { ApiXTdhContribution } from "@/generated/models/ApiXTdhContribution";

import type { XtdhTokenContributorsGroupBy } from "@/components/xtdh/received/constants";
import { formatXtdhRate, formatXtdhValue } from "../../../utils/formatters";
import type { XtdhTokenListItemMetricItem } from "../../subcomponents/XtdhTokenListItemMetrics";
import { XtdhTokenListItemMetrics } from "../../subcomponents/XtdhTokenListItemMetrics";

interface XtdhTokenContributorsListItemProps {
  readonly contribution: ApiXTdhContribution;
  readonly groupBy: XtdhTokenContributorsGroupBy;
}

export function XtdhTokenContributorsListItem({
  contribution,
  groupBy,
}: Readonly<XtdhTokenContributorsListItemProps>) {
  const grantorHandle = contribution.grantor?.handle ?? null;
  const tooltipIdentity = grantorHandle ?? contribution.grantor?.id ?? "";
  const displayHandle =
    grantorHandle ??
    shortenAddress(contribution.grantor?.primary_address) ??
    "Unknown grantor";
  const profileHref = grantorHandle ? `/${grantorHandle}` : undefined;

  const metrics: ReadonlyArray<XtdhTokenListItemMetricItem> = [
    { label: "xTDH", value: formatXtdhValue(contribution.xtdh) },
    { label: "xTDH rate", value: formatXtdhRate(contribution.xtdh_rate) },
    {
      label: "Total grants",
      value:
        typeof contribution.total_grant_count === "number"
          ? formatNumberWithCommas(contribution.total_grant_count)
          : "—",
    },
    {
      label: "Active grants",
      value:
        typeof contribution.active_grant_count === "number"
          ? formatNumberWithCommas(contribution.active_grant_count)
          : "—",
    },
  ];

  const grantId = contribution.grant?.id ?? null;
  const grantTokenCount = contribution.grant?.target_tokens_count ?? null;

  return (
    <li className="tw-list-none tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-relative tw-h-12 tw-w-12 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
            {contribution.grantor?.pfp ? (
              <Image
                src={contribution.grantor.pfp}
                alt=""
                fill
                sizes="48px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-400">
                ?
              </div>
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-gap-1">
            {tooltipIdentity ? (
              <UserProfileTooltipWrapper user={tooltipIdentity}>
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline desktop-hover:hover:tw-text-iron-300"
                  >
                    {displayHandle}
                  </Link>
                ) : (
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
                    {displayHandle}
                  </span>
                )}
              </UserProfileTooltipWrapper>
            ) : (
              <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
                {displayHandle}
              </span>
            )}
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-xs tw-text-iron-400">Grantor</span>
              {typeof contribution.grantor?.cic === "number" ? (
                <UserCICTypeIcon cic={contribution.grantor.cic} />
              ) : null}
            </div>
          </div>
        </div>
        {groupBy === "grant" && grantId ? (
          <div className="tw-flex tw-flex-col tw-items-start tw-gap-1">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
              Grant
            </p>
            <p className="tw-m-0 tw-text-sm tw-text-iron-100 tw-break-all">
              {grantId}
            </p>
            {typeof grantTokenCount === "number" ? (
              <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                Targets {formatNumberWithCommas(grantTokenCount)} tokens
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <XtdhTokenListItemMetrics metrics={metrics} />
    </li>
  );
}
