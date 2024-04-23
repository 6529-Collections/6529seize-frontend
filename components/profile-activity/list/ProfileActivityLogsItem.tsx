import {
  ProfileActivityLog,
  ProfileActivityLogType,
} from "../../../entities/IProfile";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import ProfileActivityLogBanner from "./items/ProfileActivityLogBanner";
import ProfileActivityLogClassification from "./items/ProfileActivityLogClassification";
import ProfileActivityLogContact from "./items/ProfileActivityLogContact";
import ProfileActivityLogDropCommented from "./items/ProfileActivityLogDropCommented";
import ProfileActivityLogDropCreated from "./items/ProfileActivityLogDropCreated";
import ProfileActivityLogDropRepEdit from "./items/ProfileActivityLogDropRepEdit";
import ProfileActivityLogGeneralStatement from "./items/ProfileActivityLogGeneralStatement";
import ProfileActivityLogHandle from "./items/ProfileActivityLogHandle";
import ProfileActivityLogNFTAccount from "./items/ProfileActivityLogNFTAccount";
import ProfileActivityLogPfp from "./items/ProfileActivityLogPfp";
import ProfileActivityLogPrimaryWallet from "./items/ProfileActivityLogPrimaryWallet";
import ProfileActivityLogProfileArchived from "./items/ProfileActivityLogProfileArchived";
import ProfileActivityLogRate from "./items/ProfileActivityLogRate";
import ProfileActivityLogSocialMedia from "./items/ProfileActivityLogSocialMedia";
import ProfileActivityLogSocialMediaVerificationPost from "./items/ProfileActivityLogSocialMediaVerificationPost";

export default function UserPageIdentityActivityLogItem({
  log,
}: {
  readonly log: ProfileActivityLog;
}) {
  const logType = log.type;
  switch (logType) {
    case ProfileActivityLogType.RATING_EDIT:
      return <ProfileActivityLogRate log={log} />;
    case ProfileActivityLogType.HANDLE_EDIT:
      return <ProfileActivityLogHandle log={log} />;
    case ProfileActivityLogType.PRIMARY_WALLET_EDIT:
      return <ProfileActivityLogPrimaryWallet log={log} />;
    case ProfileActivityLogType.SOCIALS_EDIT:
      return <ProfileActivityLogSocialMedia log={log} />;
    case ProfileActivityLogType.CONTACTS_EDIT:
      return <ProfileActivityLogContact log={log} />;
    case ProfileActivityLogType.SOCIAL_VERIFICATION_POST_EDIT:
      return <ProfileActivityLogSocialMediaVerificationPost log={log} />;
    case ProfileActivityLogType.CLASSIFICATION_EDIT:
      return <ProfileActivityLogClassification log={log} />;
    case ProfileActivityLogType.BANNER_1_EDIT:
      return <ProfileActivityLogBanner log={log} />;
    case ProfileActivityLogType.BANNER_2_EDIT:
      return <ProfileActivityLogBanner log={log} />;
    case ProfileActivityLogType.PFP_EDIT:
      return <ProfileActivityLogPfp log={log} />;
    case ProfileActivityLogType.PROFILE_ARCHIVED:
      return <ProfileActivityLogProfileArchived log={log} />;
    case ProfileActivityLogType.GENERAL_CIC_STATEMENT_EDIT:
      return <ProfileActivityLogGeneralStatement log={log} />;
    case ProfileActivityLogType.NFT_ACCOUNTS_EDIT:
      return <ProfileActivityLogNFTAccount log={log} />;
    case ProfileActivityLogType.DROP_REP_EDIT:
      return <ProfileActivityLogDropRepEdit log={log} />;
    case ProfileActivityLogType.DROP_COMMENT:
      return <ProfileActivityLogDropCommented log={log} />;
    case ProfileActivityLogType.DROP_CREATED:
      return <ProfileActivityLogDropCreated log={log} />;
    default:
      assertUnreachable(logType);
  }
}
