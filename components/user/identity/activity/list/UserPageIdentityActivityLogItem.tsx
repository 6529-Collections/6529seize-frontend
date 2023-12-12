import {
  IProfileAndConsolidations,
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
  profile,
}: {
  log: ProfileActivityLog;
  profile: IProfileAndConsolidations;
}) {
  const logType = log.type;
  switch (logType) {
    case ProfileActivityLogType.RATING_EDIT:
      return <UserPageIdentityActivityLogRate log={log} profile={profile} />;
    case ProfileActivityLogType.HANDLE_EDIT:
      return <UserPageIdentityActivityLogHandle log={log} profile={profile} />;
    case ProfileActivityLogType.PRIMARY_WALLET_EDIT:
      return (
        <UserPageIdentityActivityLogPrimaryWallet log={log} profile={profile} />
      );
    case ProfileActivityLogType.SOCIALS_EDIT:
      return (
        <UserPageIdentityActivityLogSocialMedia log={log} profile={profile} />
      );
    case ProfileActivityLogType.CONTACTS_EDIT:
      return <UserPageIdentityActivityLogContact log={log} profile={profile} />;
    case ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT:
      return (
        <UserPageIdentityActivityLogSocialMediaVerificationPost
          log={log}
          profile={profile}
        />
      );
    default:
      assertUnreachable(logType);
  }
}
