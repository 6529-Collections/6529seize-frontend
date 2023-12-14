import { useState } from "react";
import {
  IProfileAndConsolidations,
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogSocialsEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import { truncateMiddle } from "../../../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import CopyIcon from "../../../../../utils/icons/CopyIcon";
import { useCopyToClipboard } from "react-use";

export default function UserPageIdentityActivityLogSocialMedia({
  log,
  profile,
}: {
  log: ProfileActivityLogSocialsEdit;
  profile: IProfileAndConsolidations;
}) {
  const [title, setTitle] = useState(
    truncateMiddle(log.contents.statement.statement_value)
  );

  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard(log.contents.statement.statement_value);
    setTitle("Copied!");
    setTimeout(() => {
      setTitle(truncateMiddle(log.contents.statement.statement_value));
    }, 1000);
  };

  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center tw-justify-between">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          {/* <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 3.46776C17.4817 4.20411 18.5 5.73314 18.5 7.5C18.5 9.26686 17.4817 10.7959 16 11.5322M18 16.7664C19.5115 17.4503 20.8725 18.565 22 20M2 20C3.94649 17.5226 6.58918 16 9.5 16C12.4108 16 15.0535 17.5226 17 20M14 7.5C14 9.98528 11.9853 12 9.5 12C7.01472 12 5 9.98528 5 7.5C5 5.01472 7.01472 3 9.5 3C11.9853 3 14 5.01472 14 7.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg> */}
          <div className="tw-inline-flex tw-space-x-1.5">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
              {profile?.profile?.handle}
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
              {PROFILE_ACTIVITY_LOG_ACTION_STR[log.contents.action]}
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
              social media account
            </span>
            <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100">
              <SocialStatementIcon
                statementType={log.contents.statement.statement_type}
              />
            </div>
            <span className="tw-whitespace-nowrap tw-group tw-inline-flex tw-text-sm tw-font-semibold tw-text-iron-100">
              {title}
              <Tippy content="Copy" theme="dark" placement="top">
                <button
                  onClick={handleCopy}
                  className="tw-hidden group-hover:tw-block tw-mx-1 tw-h-5 tw-w-5 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <CopyIcon />
                </button>
              </Tippy>
            </span>
          </div>
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
