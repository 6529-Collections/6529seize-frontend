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
export default function CommunityMembersTableRow({
  member,
  rank,
}: {
  readonly member: CommunityMemberOverview;
  readonly rank: number;
}) {
  const isNotProfile =
    member.display.includes(".eth") ||
    isEthereumAddress(member.display) ||
    member.display.includes(" ");
  const isProfile = !isNotProfile;

  const textColorClass = isProfile ? "tw-text-iron-50" : "tw-text-iron-400";
  return (
    <tr className="even:tw-bg-iron-900 tw-cursor-pointer hover:tw-bg-iron-700  tw-transition tw-duration-300 tw-ease-out">
      <td className="tw-px-4 sm:tw-pl-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-400">
        {rank}
      </td>
      <td
        className={`tw-pr-4 sm:tw-pr-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium ${textColorClass}`}
      >
        <div className="tw-flex tw-items-center tw-gap-x-4">
          {isProfile ? (
            <img
              src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Community Table Profile Picture"
              className="tw-h-8 tw-w-8 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
            />
          ) : (
            <div className="tw-h-8 tw-w-8 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800"></div>
          )}
          <div className="tw-truncate tw-max-w-xs">{member.display}</div>
        </div>
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium ${
          isNotProfile ? "tw-opacity-50" : ""
        }`}
      >
        <UserLevel level={member.level} size="sm" />
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium ${textColorClass}`}
      >
        {formatNumberWithCommasOrDash(member.tdh)}
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium ${textColorClass}`}
      >
        {formatNumberWithCommasOrDash(member.rep)}
      </td>
      <td
        className={`tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium ${textColorClass}`}
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
      <td className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-400">
        2 m ago
      </td>
    </tr>
  );
}
