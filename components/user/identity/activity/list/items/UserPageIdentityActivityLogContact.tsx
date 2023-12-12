import { useState } from "react";
import {
  IProfileAndConsolidations,
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogContactsEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import { truncateMiddle } from "../../../../../../helpers/Helpers";
import { useCopyToClipboard } from "react-use";
import Tippy from "@tippyjs/react";
import CopyIcon from "../../../../../utils/icons/CopyIcon";

export default function UserPageIdentityActivityLogContact({
  log,
  profile,
}: {
  log: ProfileActivityLogContactsEdit;
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
    <li className="tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          {/* <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 8.5H12M7 12H15M9.68375 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V20.3355C3 20.8684 3 21.1348 3.10923 21.2716C3.20422 21.3906 3.34827 21.4599 3.50054 21.4597C3.67563 21.4595 3.88367 21.2931 4.29976 20.9602L6.68521 19.0518C7.17252 18.662 7.41617 18.4671 7.68749 18.3285C7.9282 18.2055 8.18443 18.1156 8.44921 18.0613C8.74767 18 9.0597 18 9.68375 18Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg> */}
          <div className="tw-inline-flex tw-space-x-1.5">
            <span className="tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-neutral-100">
              {profile?.profile?.handle}
            </span>
            <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
              {PROFILE_ACTIVITY_LOG_ACTION_STR[log.contents.action]}
            </span>
            <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
              contact
            </span>
            <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
              <SocialStatementIcon
                statementType={log.contents.statement.statement_type}
              />
            </div>
            <span className="tw-group tw-inline-flex tw-text-sm tw-font-semibold tw-text-neutral-100">
              {title}
              <Tippy content="Copy" theme="dark" placement="top">
                <button
                  onClick={handleCopy}
                  className="tw-hidden group-hover:tw-block tw-mx-1 tw-h-4 tw-w-4 tw-bg-transparent tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <CopyIcon />
                </button>
              </Tippy>
            </span>
          </div>
        </div>
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </div>
    </li>
  );
}
