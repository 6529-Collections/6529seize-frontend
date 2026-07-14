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

const TABLE_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-xs tw-font-medium tw-leading-5 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

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
    <tr className="tw-group odd:tw-bg-transparent even:tw-bg-iron-900/45 hover:tw-bg-iron-900/70">
      <td
        className={`${TABLE_CELL_CLASS_NAME} tw-text-center tw-font-semibold tw-text-iron-100`}
      >
        {rank}
      </td>
      <td className={`${TABLE_CELL_CLASS_NAME} tw-text-left ${textColorClass}`}>
        <div className="tw-flex tw-items-center tw-gap-2 md:tw-gap-3">
          <div className="tw-flex tw-h-8 tw-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 md:tw-h-10 md:tw-w-10">
            <div className="tw-h-full tw-w-full tw-max-w-full">
              <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-center">
                {member.pfp && (
                  <img
                    src={getScaledImageUri(member.pfp, ImageScale.W_AUTO_H_50)}
                    alt=""
                    className="tw-h-full tw-w-full tw-bg-transparent tw-object-contain"
                  />
                )}
              </div>
            </div>
          </div>
          <div
            className={`tw-max-w-[6rem] tw-truncate md:tw-max-w-[15rem] ${textColorClass}`}
          >
            <Link
              href={path}
              className={`tw-text-[13px] tw-font-medium tw-leading-5 tw-no-underline tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-400 group-hover:tw-no-underline md:tw-text-sm ${textColorClass}`}
            >
              {member.display}
            </Link>
          </div>
        </div>
      </td>
      <td
        className={`${TABLE_CELL_CLASS_NAME} tw-text-center ${
          isNotProfile ? "tw-opacity-50" : ""
        }`}
      >
        <UserCICAndLevel
          level={member.level}
          size={UserCICAndLevelSize.LARGE}
        />
      </td>
      <td
        className={`${TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums ${textColorClass}`}
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
        className={`${TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums ${textColorClass}`}
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
        className={`${TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums ${textColorClass}`}
      >
        {formatNumberWithCommasOrDash(member.rep)}
      </td>
      <td
        className={`${TABLE_CELL_CLASS_NAME} tw-text-right tw-tabular-nums ${textColorClass}`}
      >
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2">
          {formatNumberWithCommasOrDash(member.cic)}
          <div className="tw-h-5 tw-w-5">
            <UserCICTypeIcon cic={member.cic} />
          </div>
        </div>
      </td>
      <td className={`${TABLE_CELL_CLASS_NAME} tw-text-left ${textColorClass}`}>
        {member.last_activity && (
          <span>
            {getTimeAgoShort(member.last_activity, Date.now(), true)} ago
          </span>
        )}
      </td>
    </tr>
  );
}
