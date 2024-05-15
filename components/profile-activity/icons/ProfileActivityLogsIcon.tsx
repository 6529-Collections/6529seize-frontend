import { ProfileActivityLogType } from "../../../entities/IProfile";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import ProfileActivityLogsCICRatingIcon from "./ProfileActivityLogsCICRatingIcon";
import ProfileActivityLogsCertificateIcon from "./ProfileActivityLogsCertificateIcon";
import ProfileActivityLogsContactIcon from "./ProfileActivityLogsContactIcon";
import ProfileActivityLogsHandleIcon from "./ProfileActivityLogsHandleIcon";
import ProfileActivityLogsPrimaryWalletIcon from "./ProfileActivityLogsPrimaryWalletIcon";
import ProfileActivityLogsProfileImageIcon from "./ProfileActivityLogsProfileImageIcon";
import ProfileActivityLogsSocialMediaAccountIcon from "./ProfileActivityLogsSocialMediaAccountIcon";
import ProfileActivityLogsSocialMediaVerificationPostIcon from "./ProfileActivityLogsSocialMediaVerificationPostIcon";
import ProfileActivityLogsBannerIcon from "./ProfileActivityLogsBannerIcon";
import ProfileActivityLogsProfileArchivedIcon from "./ProfileActivityLogsProfileArchivedIcon";
import ProfileActivityLogsGeneralCICStatementIcon from "./ProfileActivityLogsGeneralCICStatementIcon";
import ProfileActivityLogsNFTAccountStatementIcon from "./ProfileActivityLogsNFTAccountStatementIcon";

export default function ProfileActivityLogsIcon({
  logType,
}: {
  readonly logType: ProfileActivityLogType;
}) {
  switch (logType) {
    case ProfileActivityLogType.RATING_EDIT:
      return <ProfileActivityLogsCICRatingIcon />;
    case ProfileActivityLogType.HANDLE_EDIT:
      return <ProfileActivityLogsHandleIcon />;
    case ProfileActivityLogType.SOCIALS_EDIT:
      return <ProfileActivityLogsSocialMediaAccountIcon />;
    case ProfileActivityLogType.CONTACTS_EDIT:
      return <ProfileActivityLogsContactIcon />;
    case ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT:
      return <ProfileActivityLogsSocialMediaVerificationPostIcon />;
    case ProfileActivityLogType.CLASSIFICATION_EDIT:
      return <ProfileActivityLogsCertificateIcon />;
    case ProfileActivityLogType.BANNER_1_EDIT:
      return <ProfileActivityLogsBannerIcon />;
    case ProfileActivityLogType.BANNER_2_EDIT:
      return <ProfileActivityLogsBannerIcon />;
    case ProfileActivityLogType.PFP_EDIT:
      return <ProfileActivityLogsProfileImageIcon />;
    case ProfileActivityLogType.PROFILE_ARCHIVED:
      return <ProfileActivityLogsProfileArchivedIcon />;
    case ProfileActivityLogType.GENERAL_CIC_STATEMENT_EDIT:
      return <ProfileActivityLogsGeneralCICStatementIcon />;
    case ProfileActivityLogType.NFT_ACCOUNTS_EDIT:
      return <ProfileActivityLogsNFTAccountStatementIcon />;
    // TODO: Add icons for these log types
    case ProfileActivityLogType.PROXY_CREATED:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-neutral-100"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 17V16.8C4 15.1198 4 14.2798 4.32698 13.638C4.6146 13.0735 5.07354 12.6146 5.63803 12.327C6.27976 12 7.11984 12 8.8 12L15.2 12C16.8802 12 17.7202 12 18.362 12.327C18.9265 12.6146 19.3854 13.0735 19.673 13.638C20 14.2798 20 15.1198 20 16.8V17M4 17C2.89543 17 2 17.8954 2 19C2 20.1046 2.89543 21 4 21C5.10457 21 6 20.1046 6 19C6 17.8954 5.10457 17 4 17ZM20 17C18.8954 17 18 17.8954 18 19C18 20.1046 18.8954 21 20 21C21.1046 21 22 20.1046 22 19C22 17.8954 21.1046 17 20 17ZM12 7L12 17M12 7C10.8954 7 10 6.10457 10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5C14 6.10457 13.1046 7 12 7ZM12 17C10.8954 17 10 17.8954 10 19C10 20.1046 10.8954 21 12 21C13.1046 21 14 20.1046 14 19C14 17.8954 13.1046 17 12 17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case ProfileActivityLogType.PROXY_ACTION_CREATED:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-neutral-100"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 18V17.8C4 16.1198 4 15.2798 4.32698 14.638C4.6146 14.0735 5.07354 13.6146 5.63803 13.327C6.27976 13 7.11984 13 8.8 13H15.2C16.8802 13 17.7202 13 18.362 13.327C18.9265 13.6146 19.3854 14.0735 19.673 14.638C20 15.2798 20 16.1198 20 17.8V18M4 18C2.89543 18 2 18.8954 2 20C2 21.1046 2.89543 22 4 22C5.10457 22 6 21.1046 6 20C6 18.8954 5.10457 18 4 18ZM20 18C18.8954 18 18 18.8954 18 20C18 21.1046 18.8954 22 20 22C21.1046 22 22 21.1046 22 20C22 18.8954 21.1046 18 20 18ZM12 18C10.8954 18 10 18.8954 10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20C14 18.8954 13.1046 18 12 18ZM12 18V8M6 8H18C18.9319 8 19.3978 8 19.7654 7.84776C20.2554 7.64477 20.6448 7.25542 20.8478 6.76537C21 6.39782 21 5.93188 21 5C21 4.06812 21 3.60218 20.8478 3.23463C20.6448 2.74458 20.2554 2.35523 19.7654 2.15224C19.3978 2 18.9319 2 18 2H6C5.06812 2 4.60218 2 4.23463 2.15224C3.74458 2.35523 3.35523 2.74458 3.15224 3.23463C3 3.60218 3 4.06812 3 5C3 5.93188 3 6.39782 3.15224 6.76537C3.35523 7.25542 3.74458 7.64477 4.23463 7.84776C4.60218 8 5.06812 8 6 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-neutral-100"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572M22 4L12 14.01L9 11.01"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      );
    case ProfileActivityLogType.PROXY_ACTION_CHANGED:
      return (
        <svg
          className="tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-neutral-100"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 18L19.9999 19.094C19.4695 19.6741 18.7502 20 18.0002 20C17.2501 20 16.5308 19.6741 16.0004 19.094C15.4693 18.5151 14.75 18.1901 14.0002 18.1901C13.2504 18.1901 12.5312 18.5151 12 19.094M3.00003 20H4.67457C5.16376 20 5.40835 20 5.63852 19.9447C5.84259 19.8957 6.03768 19.8149 6.21663 19.7053C6.41846 19.5816 6.59141 19.4086 6.93732 19.0627L19.5001 6.49998C20.3285 5.67156 20.3285 4.32841 19.5001 3.49998C18.6716 2.67156 17.3285 2.67156 16.5001 3.49998L3.93729 16.0627C3.59139 16.4086 3.41843 16.5816 3.29475 16.7834C3.18509 16.9624 3.10428 17.1574 3.05529 17.3615C3.00003 17.5917 3.00003 17.8363 3.00003 18.3255V20Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case ProfileActivityLogType.DROP_COMMENT:
    case ProfileActivityLogType.DROP_RATING_EDIT:
    case ProfileActivityLogType.DROP_CREATED:
      return <></>;
    default:
      assertUnreachable(logType);
  }
}
