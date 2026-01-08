import type {
  CommunityMemberOverview} from "@/entities/IProfile";
import {
  CIC_TO_TEXT,
} from "@/entities/IProfile";
import {
  formatNumberWithCommasOrDash,
  cicToType,
} from "@/helpers/Helpers";
import UserLevel from "@/components/user/utils/level/UserLevel";
import { Tooltip } from "react-tooltip";
import UserCICTypeIcon from "@/components/user/utils/user-cic-type/UserCICTypeIcon";
import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import { ImageScale, getScaledImageUri } from "@/helpers/image.helpers";
import CommonTimeAgo from "@/components/utils/CommonTimeAgo";
import Link from "next/link";

export default function CommunityMembersTableRow({
  member,
  rank,
}: {
  readonly member: CommunityMemberOverview;
  readonly rank: number;
}) {
  const isNotProfile = isEthereumAddress(member.detail_view_key);
  const isProfile = !isNotProfile;

  const textColorClass = isProfile ? "tw-text-iron-50" : "tw-text-iron-400";
  const path = `/${member.detail_view_key}`;
  return (
    <tr className="even:tw-bg-iron-900 tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out">
      <td className="tw-px-4 sm:tw-pl-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium tw-text-iron-400">
        {rank}
      </td>
      <td
        className={`tw-group tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}>
        <div className="tw-flex tw-gap-x-4 tw-items-center">
          <div className="tw-h-8 tw-w-8 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-900">
            <div className="tw-h-full tw-w-full tw-max-w-full">
              <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                {member.pfp && (
                  <img
                    src={getScaledImageUri(member.pfp, ImageScale.W_AUTO_H_50)}
                    alt="Network Table Profile Picture"
                    className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                  />
                )}
              </div>
            </div>
          </div>
          <div
            className={`tw-truncate tw-max-w-[8rem] sm:tw-max-w-xs ${textColorClass}`}>
            <Link
              href={path}
              className={`tw-no-underline group-hover:tw-underline group-hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out ${textColorClass}`}>
              {member.display}
            </Link>
          </div>
        </div>
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium  ${
          isNotProfile ? "tw-opacity-50" : ""
        }`}>
        <UserLevel level={member.level} size="sm" />
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-tabular-nums tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}>
        {formatNumberWithCommasOrDash(member.tdh)}
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-tabular-nums tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}>
        {formatNumberWithCommasOrDash(member.rep)}
      </td>
      <td
        className={`tw-px-4 tw-text-right tw-tabular-nums tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}>
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2">
          {formatNumberWithCommasOrDash(member.cic)}
          <div 
            className="tw-h-5 tw-w-5"
            data-tooltip-id={`cic-tooltip-${member.detail_view_key}`}>
            <UserCICTypeIcon cic={member.cic} />
          </div>
          <Tooltip
            id={`cic-tooltip-${member.detail_view_key}`}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}>
            {CIC_TO_TEXT[cicToType(member.cic)]}
          </Tooltip>
        </div>
      </td>
      <td className="tw-px-4 sm:tw-pr-6 tw-whitespace-nowrap tw-group tw-py-3">
        {member.last_activity && (
          <CommonTimeAgo timestamp={member.last_activity} />
        )}
      </td>
    </tr>
  );
}
