
import { ProfileActivityLogType } from "../../../../../entities/IProfile";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityActivityLogCICRatingIcon from "./UserPageIdentityActivityLogCICRatingIcon";
import UserPageIdentityActivityLogContactIcon from "./UserPageIdentityActivityLogContactIcon";
import UserPageIdentityActivityLogHandleIcon from "./UserPageIdentityActivityLogHandleIcon";
import UserPageIdentityActivityLogPrimaryWalletIcon from "./UserPageIdentityActivityLogPrimaryWalletIcon";
import UserPageIdentityActivityLogSocialMediaAccountIcon from "./UserPageIdentityActivityLogSocialMediaAccountIcon";
import UserPageIdentityActivityLogSocialMediaVerificationPostIcon from "./UserPageIdentityActivityLogSocialMediaVerificationPostIcon";

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
    default:
      assertUnreachable(logType);
  }
}
