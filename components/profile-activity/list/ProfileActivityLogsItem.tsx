import { ProfileActivityLog } from "@/entities/IProfile";
import { ProfileActivityLogType } from "@/enums";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import ProfileActivityLogBanner from "./items/ProfileActivityLogBanner";
import ProfileActivityLogClassification from "./items/ProfileActivityLogClassification";
import ProfileActivityLogContact from "./items/ProfileActivityLogContact";
import ProfileActivityLogGeneralStatement from "./items/ProfileActivityLogGeneralStatement";
import ProfileActivityLogHandle from "./items/ProfileActivityLogHandle";
import ProfileActivityLogNFTAccount from "./items/ProfileActivityLogNFTAccount";
import ProfileActivityLogPfp from "./items/ProfileActivityLogPfp";
import ProfileActivityLogProfileArchived from "./items/ProfileActivityLogProfileArchived";
import ProfileActivityLogProxy from "./items/ProfileActivityLogProxy";
import ProfileActivityLogProxyAction from "./items/ProfileActivityLogProxyAction";
import ProfileActivityLogProxyActionChange from "./items/ProfileActivityLogProxyActionChange";
import ProfileActivityLogProxyActionState from "./items/ProfileActivityLogProxyActionState";
import ProfileActivityLogRate from "./items/ProfileActivityLogRate";
import ProfileActivityLogSocialMedia from "./items/ProfileActivityLogSocialMedia";
import ProfileActivityLogSocialMediaVerificationPost from "./items/ProfileActivityLogSocialMediaVerificationPost";

export default function UserPageIdentityActivityLogItem({
  log,
  user,
}: {
  readonly log: ProfileActivityLog;
  readonly user: string | null;
}) {
  const logType = log.type;
  switch (logType) {
    case ProfileActivityLogType.RATING_EDIT:
      return <ProfileActivityLogRate log={log} user={user} />;
    case ProfileActivityLogType.HANDLE_EDIT:
      return <ProfileActivityLogHandle log={log} />;
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
    case ProfileActivityLogType.PROXY_CREATED:
      return <ProfileActivityLogProxy log={log} />;
    case ProfileActivityLogType.PROXY_ACTION_CREATED:
      return <ProfileActivityLogProxyAction log={log} />;
    case ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED:
      return <ProfileActivityLogProxyActionState log={log} />;
    case ProfileActivityLogType.PROXY_ACTION_CHANGED:
      return <ProfileActivityLogProxyActionChange log={log} />;
    case ProfileActivityLogType.DROP_COMMENT:
    case ProfileActivityLogType.DROP_RATING_EDIT:
    case ProfileActivityLogType.DROP_CREATED:
    case ProfileActivityLogType.PROXY_DROP_RATING_EDIT:
      return <></>;
    default:
      assertUnreachable(logType);
  }
}
