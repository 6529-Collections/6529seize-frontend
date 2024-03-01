import {
  CommunityMemberOverview,
  CIC_TO_TEXT,
} from "../../../entities/IProfile";
import { formatNumberWithCommasOrDash } from "../../../helpers/Helpers";
import UserLevel from "../../user/utils/level/UserLevel";
import Tippy from "@tippyjs/react";
import UserCICTypeIcon from "../../user/utils/user-cic-type/UserCICTypeIcon";
import { cicToType } from "../../../helpers/Helpers";
import { isEthereumAddress } from "../../../helpers/AllowlistToolHelpers";
import { ImageScale, getScaledImageUri } from "../../../helpers/image.helpers";
import CommonTimeAgo from "../../utils/CommonTimeAgo";
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
        className={`tw-group tw-pr-2 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}
      >
        {member.pfp ? (
          <img
            src={getScaledImageUri(member.pfp, ImageScale.W_AUTO_H_50)}
            alt="Community Table Profile Picture"
            className="tw-flex-shrink-0 tw-object-contain tw-max-h-8 tw-w-auto tw-h-auto tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
          />
        ) : (
          <div className="tw-h-8 tw-w-8 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800"></div>
        )}
      </td>
      <td
        className={`tw-group tw-pr-4 sm:tw-pr-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}
      >
        <div className="tw-truncate tw-max-w-[12rem] sm:tw-max-w-xs">
          <Link
            href={path}
            className="tw-no-underline group-hover:tw-underline group-hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
          >
            {member.display}
          </Link>
        </div>
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${
          isNotProfile ? "tw-opacity-50" : ""
        }`}
      >
        <UserLevel level={member.level} size="sm" />
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}
      >
        {formatNumberWithCommasOrDash(member.tdh)}
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}
      >
        {formatNumberWithCommasOrDash(member.rep)}
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-base tw-font-medium ${textColorClass}`}
      >
        <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2">
          {formatNumberWithCommasOrDash(member.cic)}
          <Tippy
            placement={"top"}
            interactive={false}
            content={CIC_TO_TEXT[cicToType(member.cic)]}
          >
            <div className="tw-h-5 tw-w-5">
              <UserCICTypeIcon cic={member.cic} />
            </div>
          </Tippy>
        </div>
      </td>
      <td className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-py-3">
        {member.last_activity && (
          <CommonTimeAgo timestamp={member.last_activity} />
        )}
      </td>
    </tr>
  );
}
