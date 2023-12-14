import { useState } from "react";
import {
  IProfileAndConsolidations,
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogSocialVerificationPostEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import { truncateMiddle } from "../../../../../../helpers/Helpers";
import { useCopyToClipboard } from "react-use";
import Tippy from "@tippyjs/react";
import CopyIcon from "../../../../../utils/icons/CopyIcon";

export default function UserPageIdentityActivityLogSocialMediaVerificationPost({
  log,
  profile,
}: {
  log: ProfileActivityLogSocialVerificationPostEdit;
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
      <td className="tw-py-4 tw-flex tw-items-center">
       
          {/* <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V13M13 17H7M15 13H7M20.1213 3.87868C21.2929 5.05025 21.2929 6.94975 20.1213 8.12132C18.9497 9.29289 17.0503 9.29289 15.8787 8.12132C14.7071 6.94975 14.7071 5.05025 15.8787 3.87868C17.0503 2.70711 18.9497 2.70711 20.1213 3.87868Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg> */}
          <div className="tw-mt-1 tw-inline-flex tw-space-x-1.5">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
              {profile?.profile?.handle}
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
              {PROFILE_ACTIVITY_LOG_ACTION_STR[log.contents.action]}
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
              social media verification post
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
      
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
