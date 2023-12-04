import { PROFILE_ACTIVITY_TYPE } from "../../../../../entities/IProfile";
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
  logType: PROFILE_ACTIVITY_TYPE;
}) {
  switch (logType) {
    case PROFILE_ACTIVITY_TYPE.CIC_RATING:
      return <UserPageIdentityActivityLogCICRatingIcon />;
    case PROFILE_ACTIVITY_TYPE.HANDLE:
      return <UserPageIdentityActivityLogHandleIcon />;
    case PROFILE_ACTIVITY_TYPE.PRIMARY_WALLET:
      return <UserPageIdentityActivityLogPrimaryWalletIcon />;
    case PROFILE_ACTIVITY_TYPE.SOCIAL_MEDIA_ACCOUNT:
      return <UserPageIdentityActivityLogSocialMediaAccountIcon />;
    case PROFILE_ACTIVITY_TYPE.CONTACT:
      return <UserPageIdentityActivityLogContactIcon />;
    case PROFILE_ACTIVITY_TYPE.SOCIAL_MEDIA_VERIFICATION_POST:
      return <UserPageIdentityActivityLogSocialMediaVerificationPostIcon />;
    default:
      assertUnreachable(logType);
  }
}
