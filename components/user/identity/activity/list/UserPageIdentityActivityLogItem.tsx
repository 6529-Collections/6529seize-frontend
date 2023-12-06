import {
  ProfileActivityLog,
  ProfileActivityLogType,
} from "../../../../../entities/IProfile";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageIdentityActivityLogContact from "./items/UserPageIdentityActivityLogContact";
import UserPageIdentityActivityLogHandle from "./items/UserPageIdentityActivityLogHandle";
import UserPageIdentityActivityLogPrimaryWallet from "./items/UserPageIdentityActivityLogPrimaryWallet";
import UserPageIdentityActivityLogRate from "./items/UserPageIdentityActivityLogRate";
import UserPageIdentityActivityLogSocialMedia from "./items/UserPageIdentityActivityLogSocialMedia";
import UserPageIdentityActivityLogSocialMediaVerificationPost from "./items/UserPageIdentityActivityLogSocialMediaVerificationPost";

export default function UserPageIdentityActivityLogItem({
  log,
}: {
  log: ProfileActivityLog;
  }) {
  const logType = log.type;
  switch (logType) {
    case ProfileActivityLogType.RATING_EDIT:
      return <UserPageIdentityActivityLogRate log={log} />;
    case ProfileActivityLogType.HANDLE_EDIT:
      return <UserPageIdentityActivityLogHandle log={log} />;
    case ProfileActivityLogType.PRIMARY_WALLET_EDIT:
      return <UserPageIdentityActivityLogPrimaryWallet log={log} />;
    case ProfileActivityLogType.SOCIALS_EDIT:
      return <UserPageIdentityActivityLogSocialMedia log={log} />;
    case ProfileActivityLogType.CONTACTS_EDIT:
      return <UserPageIdentityActivityLogContact log={log} />;
    case ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT:
      return (
        <UserPageIdentityActivityLogSocialMediaVerificationPost log={log} />
      );
    default:
      assertUnreachable(logType);
  }
}
