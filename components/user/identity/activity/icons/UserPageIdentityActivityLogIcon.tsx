import { ProfileActivityLogType } from "../../../../../entities/IProfile";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityActivityLogCICRatingIcon from "./UserPageIdentityActivityLogCICRatingIcon";
import UserPageIdentityActivityLogCertificateIcon from "./UserPageIdentityActivityLogCertificateIcon";
import UserPageIdentityActivityLogContactIcon from "./UserPageIdentityActivityLogContactIcon";
import UserPageIdentityActivityLogHandleIcon from "./UserPageIdentityActivityLogHandleIcon";
import UserPageIdentityActivityLogPrimaryWalletIcon from "./UserPageIdentityActivityLogPrimaryWalletIcon";
import UserPageIdentityActivityLogProfileImageIcon from "./UserPageIdentityActivityLogProfileImageIcon";
import UserPageIdentityActivityLogSocialMediaAccountIcon from "./UserPageIdentityActivityLogSocialMediaAccountIcon";
import UserPageIdentityActivityLogSocialMediaVerificationPostIcon from "./UserPageIdentityActivityLogSocialMediaVerificationPostIcon";
import UserPageIdentityActivityLogWebsiteIcon from "./UserPageIdentityActivityLogWebsiteIcon";
import UserPageIdentityActivityLogBannerIcon from "./UserPageIdentityActivityLogBannerIcon";

export default function UserPageIdentityActivityLogIcon({
  logType,
}: {
  logType: ProfileActivityLogType;
}) {
  switch (logType) {
    case ProfileActivityLogType.RATING_EDIT:
      return <UserPageIdentityActivityLogCICRatingIcon />;
    case ProfileActivityLogType.HANDLE_EDIT:
      return <UserPageIdentityActivityLogHandleIcon />;
    case ProfileActivityLogType.PRIMARY_WALLET_EDIT:
      return <UserPageIdentityActivityLogPrimaryWalletIcon />;
    case ProfileActivityLogType.SOCIALS_EDIT:
      return <UserPageIdentityActivityLogSocialMediaAccountIcon />;
    case ProfileActivityLogType.CONTACTS_EDIT:
      return <UserPageIdentityActivityLogContactIcon />;
    case ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT:
      return <UserPageIdentityActivityLogSocialMediaVerificationPostIcon />;
    case ProfileActivityLogType.CLASSIFICATION_EDIT:
      return <UserPageIdentityActivityLogCertificateIcon />;
    case ProfileActivityLogType.BANNER_1_EDIT:
      return <UserPageIdentityActivityLogBannerIcon />;
    case ProfileActivityLogType.BANNER_2_EDIT:
      return <UserPageIdentityActivityLogBannerIcon />;
    case ProfileActivityLogType.WEBSITE_EDIT:
      return <UserPageIdentityActivityLogWebsiteIcon />;
    case ProfileActivityLogType.PFP_EDIT:
      return <UserPageIdentityActivityLogProfileImageIcon />;
    default:
      assertUnreachable(logType);
  }
}
