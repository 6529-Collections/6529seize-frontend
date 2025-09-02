import { ProfileActivityLogType } from "@/enums";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import ProfileActivityLogsBannerIcon from "./ProfileActivityLogsBannerIcon";
import ProfileActivityLogsCICRatingIcon from "./ProfileActivityLogsCICRatingIcon";
import ProfileActivityLogsCertificateIcon from "./ProfileActivityLogsCertificateIcon";
import ProfileActivityLogsContactIcon from "./ProfileActivityLogsContactIcon";
import ProfileActivityLogsGeneralCICStatementIcon from "./ProfileActivityLogsGeneralCICStatementIcon";
import ProfileActivityLogsHandleIcon from "./ProfileActivityLogsHandleIcon";
import ProfileActivityLogsNFTAccountStatementIcon from "./ProfileActivityLogsNFTAccountStatementIcon";
import ProfileActivityLogsProfileArchivedIcon from "./ProfileActivityLogsProfileArchivedIcon";
import ProfileActivityLogsProfileImageIcon from "./ProfileActivityLogsProfileImageIcon";
import ProfileActivityLogsProxyActionChangedIcon from "./ProfileActivityLogsProxyActionChangedIcon";
import ProfileActivityLogsProxyActionCreatedIcon from "./ProfileActivityLogsProxyActionCreatedIcon";
import ProfileActivityLogsProxyActionStateChangedIcon from "./ProfileActivityLogsProxyActionStateChangedIcon";
import ProfileActivityLogsProxyCreatedIcon from "./ProfileActivityLogsProxyCreatedIcon";
import ProfileActivityLogsSocialMediaAccountIcon from "./ProfileActivityLogsSocialMediaAccountIcon";
import ProfileActivityLogsSocialMediaVerificationPostIcon from "./ProfileActivityLogsSocialMediaVerificationPostIcon";

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
    case ProfileActivityLogType.PROXY_CREATED:
      return <ProfileActivityLogsProxyCreatedIcon />;
    case ProfileActivityLogType.PROXY_ACTION_CREATED:
      return <ProfileActivityLogsProxyActionCreatedIcon />;
    case ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED:
      return <ProfileActivityLogsProxyActionStateChangedIcon />;
    case ProfileActivityLogType.PROXY_ACTION_CHANGED:
      return <ProfileActivityLogsProxyActionChangedIcon />;
    case ProfileActivityLogType.DROP_COMMENT:
    case ProfileActivityLogType.DROP_RATING_EDIT:
    case ProfileActivityLogType.DROP_CREATED:
    case ProfileActivityLogType.PROXY_DROP_RATING_EDIT:
      return <></>;
    default:
      assertUnreachable(logType);
  }
}
