import {
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogSocialVerificationPostEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";

export default function UserPageIdentityActivityLogSocialMediaVerificationPost({
  log,
}: {
  log: ProfileActivityLogSocialVerificationPostEdit;
}) {
  return (
    <li className="tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
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
          </svg>
          <div className="tw-inline-flex tw-space-x-1.5">
            <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
              {PROFILE_ACTIVITY_LOG_ACTION_STR[log.contents.action]}
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-medium">
              social media verification post 
            </span>
            <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
              <SocialStatementIcon
                statementType={log.contents.statement.statement_type}
              />
            </div>
            <span className="tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-neutral-100">
              {log.contents.statement.statement_value}
            </span>
          </div>
        </div>
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </div>
    </li>
  );
}
