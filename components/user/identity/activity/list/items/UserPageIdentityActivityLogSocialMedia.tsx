import {
  PROFILE_ACTIVITY_LOG_ACTION_STR,
  ProfileActivityLogSocialsEdit,
} from "../../../../../../entities/IProfile";
import SocialStatementIcon from "../../../../utils/icons/SocialStatementIcon";

export default function UserPageIdentityActivityLogSocialMedia({
  log,
}: {
  log: ProfileActivityLogSocialsEdit;
}) {
  console.log(log);
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
              d="M16 3.46776C17.4817 4.20411 18.5 5.73314 18.5 7.5C18.5 9.26686 17.4817 10.7959 16 11.5322M18 16.7664C19.5115 17.4503 20.8725 18.565 22 20M2 20C3.94649 17.5226 6.58918 16 9.5 16C12.4108 16 15.0535 17.5226 17 20M14 7.5C14 9.98528 11.9853 12 9.5 12C7.01472 12 5 9.98528 5 7.5C5 5.01472 7.01472 3 9.5 3C11.9853 3 14 5.01472 14 7.5Z"
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
              social media account
            </span>
            <div className="tw-flex tw-items-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100">
              <SocialStatementIcon
                statementType={log.contents.statement.statement_type}
              />
            </div>
            <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
              {log.contents.statement.statement_value}
            </span>
          </div>
        </div>
        <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
          <span>1h</span>
          <span className="tw-ml-1">ago</span>
        </span>
      </div>
    </li>
  );
}
