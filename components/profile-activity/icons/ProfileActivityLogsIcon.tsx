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
import ProfileActivityLogsNFTAccountStatementIcon from "./ProfileActivityLogsNFTAccountStatementIcon"

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
    case ProfileActivityLogType.PRIMARY_WALLET_EDIT:
      return <ProfileActivityLogsPrimaryWalletIcon />;
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
    default:
      assertUnreachable(logType);
  }
}
