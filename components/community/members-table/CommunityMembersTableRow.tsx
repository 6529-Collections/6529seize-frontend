import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import {
  formatNumberWithCommasOrDash,
  getTimeAgoShort,
} from "@/helpers/Helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import Link from "next/link";

export default function CommunityMembersTableRow({
  member,
  rank,
}: {
  readonly member: ApiCommunityMemberOverview;
  readonly rank: number;
}) {
  const isNotProfile = isEthereumAddress(member.detail_view_key);
  const isProfile = !isNotProfile;

  const textColorClass = isProfile ? "tw-text-iron-50" : "tw-text-iron-400";
  const path = `/${member.detail_view_key}`;
  return (
    <tr className="tw-transition tw-duration-300 tw-ease-out even:tw-bg-iron-900">
      <td className="tw-group tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-2 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-pl-4">
        {rank}
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-py-3 tw-pr-3 tw-text-sm lg:tw-text-base tw-font-medium ${textColorClass}`}
      >
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-h-8 tw-w-8 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
            <div className="tw-h-full tw-w-full tw-max-w-full">
              <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                {member.pfp && (
                  <img
                    src={getScaledImageUri(member.pfp, ImageScale.W_AUTO_H_50)}
                    alt="Network Table Profile Picture"
                    className="tw-mx-auto tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-bg-transparent tw-object-contain"
                  />
                )}
              </div>
            </div>
          </div>
          <UserCICAndLevel
            level={member.level}
            size={UserCICAndLevelSize.SMALL}
          />
          <div
            className={`tw-max-w-[8rem] tw-truncate sm:tw-max-w-[14rem] lg:tw-max-w-[18rem] ${textColorClass}`}
          >
            <Link
              href={path}
              className={`tw-no-underline tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-500 group-hover:tw-underline ${textColorClass}`}
            >
              {member.display}
            </Link>
          </div>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right tw-text-sm lg:tw-text-base tw-font-medium tw-tabular-nums ${textColorClass}`}
      >
        <div className="tw-flex tw-flex-col tw-items-end">
          <span>{formatNumberWithCommasOrDash(member.tdh)}</span>
          <span className="tw-text-xs tw-text-iron-400">
            {member.tdh_rate > 0 ? "+" : ""}
            {formatNumberWithCommasOrDash(Math.round(member.tdh_rate))}
          </span>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right tw-text-sm lg:tw-text-base tw-font-medium tw-tabular-nums ${textColorClass}`}
      >
        <div className="tw-flex tw-flex-col tw-items-end">
          <span>{formatNumberWithCommasOrDash(Math.round(member.xtdh))}</span>
          <span className="tw-text-xs tw-text-iron-400">
            {member.xtdh_rate > 0 ? "+" : ""}
            {formatNumberWithCommasOrDash(Math.round(member.xtdh_rate))}
          </span>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right tw-text-sm lg:tw-text-base tw-font-medium tw-tabular-nums ${textColorClass}`}
      >
        <div className="tw-flex tw-flex-col tw-items-end">
          <span>
            {formatNumberWithCommasOrDash(Math.round(member.combined_tdh))}
          </span>
          <span className="tw-text-xs tw-text-iron-400">
            {member.combined_tdh_rate > 0 ? "+" : ""}
            {formatNumberWithCommasOrDash(Math.round(member.combined_tdh_rate))}
          </span>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right tw-text-sm lg:tw-text-base tw-font-medium tw-tabular-nums ${textColorClass}`}
      >
        <div className="tw-flex tw-flex-col tw-items-end tw-gap-y-0.5">
          <div className="tw-flex tw-items-center tw-gap-x-1">
            <span className="tw-text-xs tw-text-iron-400">In:</span>
            <span>{formatNumberWithCommasOrDash(Math.round(member.xtdh_incoming))}</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-1">
            <span className="tw-text-xs tw-text-iron-400">Out:</span>
            <span>{formatNumberWithCommasOrDash(Math.round(member.xtdh_outgoing))}</span>
          </div>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right tw-text-sm lg:tw-text-base tw-font-medium tw-tabular-nums ${textColorClass}`}
      >
        <div className="tw-flex tw-flex-col tw-items-end tw-gap-y-0.5">
          <div className="tw-flex tw-items-center tw-gap-x-1">
            <span className="tw-text-xs tw-text-iron-400">REP:</span>
            <span>{formatNumberWithCommasOrDash(member.rep)}</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-1">
            <span className="tw-text-xs tw-text-iron-400">NIC:</span>
            <span>{formatNumberWithCommasOrDash(member.cic)}</span>
          </div>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-3 tw-py-3 tw-text-right tw-text-sm tw-font-medium sm:tw-pr-4 ${textColorClass}`}
      >
        {member.last_activity && (
          <span>
            {getTimeAgoShort(member.last_activity, Date.now(), true)} ago
          </span>
        )}
      </td>
    </tr>
  );
}
