import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserCICTypeIcon from "@/components/user/utils/user-cic-type/UserCICTypeIcon";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import {
  formatLargeNumber,
  formatNumberWithCommasOrDash,
  getTimeAgoShort,
} from "@/helpers/Helpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import Link from "next/link";
import { Tooltip } from "react-tooltip";

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
      <td className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-pl-6 sm:tw-text-base">
        {rank}
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-py-3 tw-pr-4 tw-text-sm tw-font-medium sm:tw-text-base ${textColorClass}`}
      >
        <div className="tw-flex tw-items-center tw-gap-x-4">
          <div className="tw-h-8 tw-w-8 tw-overflow-hidden tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
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
          <div
            className={`tw-max-w-[6rem] tw-truncate sm:tw-max-w-[15rem] ${textColorClass}`}
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
        className={`tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-base ${
          isNotProfile ? "tw-opacity-50" : ""
        }`}
      >
        <UserCICAndLevel
          level={member.level}
          size={UserCICAndLevelSize.MEDIUM}
        />
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-tabular-nums sm:tw-px-6 sm:tw-text-base ${textColorClass}`}
      >
        <span
          data-tooltip-id={`tdh-tooltip-${member.detail_view_key}`}
          className="tw-cursor-default"
        >
          {member.tdh === 0 ? "-" : formatLargeNumber(member.tdh)}
        </span>
        <Tooltip
          id={`tdh-tooltip-${member.detail_view_key}`}
          place="top"
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "8px 12px",
          }}
        >
          <div className="tw-flex tw-flex-col tw-gap-y-1">
            <span>TDH: {formatNumberWithCommasOrDash(member.tdh)}</span>
            <span>
              TDH Rate: {member.tdh_rate > 0 ? "+" : ""}
              {formatNumberWithCommasOrDash(Math.round(member.tdh_rate))}
            </span>
          </div>
        </Tooltip>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-tabular-nums sm:tw-px-6 sm:tw-text-base ${textColorClass}`}
      >
        <span
          data-tooltip-id={`xtdh-tooltip-${member.detail_view_key}`}
          className="tw-cursor-default"
        >
          {member.xtdh === 0 ? "-" : formatLargeNumber(Math.round(member.xtdh))}
        </span>
        <Tooltip
          id={`xtdh-tooltip-${member.detail_view_key}`}
          place="top"
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "8px 12px",
          }}
        >
          <div className="tw-flex tw-flex-col tw-gap-y-1">
            <span>
              xTDH: {formatNumberWithCommasOrDash(Math.round(member.xtdh))}
            </span>
            <span>
              xTDH Rate: {member.xtdh_rate > 0 ? "+" : ""}
              {formatNumberWithCommasOrDash(Math.round(member.xtdh_rate))}
            </span>
          </div>
        </Tooltip>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-tabular-nums sm:tw-px-6 sm:tw-text-base ${textColorClass}`}
      >
        {formatNumberWithCommasOrDash(member.rep)}
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-tabular-nums sm:tw-text-base ${textColorClass}`}
      >
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2">
          {formatNumberWithCommasOrDash(member.cic)}
          <div className="tw-h-5 tw-w-5">
            <UserCICTypeIcon cic={member.cic} />
          </div>
        </div>
      </td>
      <td
        className={`tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium sm:tw-pr-6 sm:tw-text-base ${textColorClass}`}
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
