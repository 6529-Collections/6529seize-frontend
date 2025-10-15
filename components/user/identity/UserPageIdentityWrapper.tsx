import { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CountlessPage, Page } from "@/helpers/Types";
import {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import UserPageIdentity from "./UserPageIdentity";

export default function UserPageIdentityWrapper({
  profile: initialProfile,
  initialCICReceivedParams,
  initialCICGivenParams,
  initialActivityLogParams,
  handleOrWallet,
  initialStatements,
  initialCicGivenData,
  initialCicReceivedData,
  initialActivityLogData,
}: {
  readonly profile: ApiIdentity;
  readonly initialCICReceivedParams: ProfileRatersParams;
  readonly initialCICGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
  readonly handleOrWallet: string;
  readonly initialStatements: CicStatement[];
  readonly initialCicGivenData: Page<RatingWithProfileInfoAndLevel>;
  readonly initialCicReceivedData: Page<RatingWithProfileInfoAndLevel>;
  readonly initialActivityLogData: CountlessPage<ProfileActivityLog>;
}) {
  return (
    <UserPageSetUpProfileWrapper
      profile={initialProfile}
      handleOrWallet={handleOrWallet}
    >
      <UserPageIdentity
        profile={initialProfile}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCICGivenParams={initialCICGivenParams}
        initialActivityLogParams={initialActivityLogParams}
        handleOrWallet={handleOrWallet}
        initialStatements={initialStatements}
        initialCicGivenData={initialCicGivenData}
        initialCicReceivedData={initialCicReceivedData}
        initialActivityLogData={initialActivityLogData}
      />
    </UserPageSetUpProfileWrapper>
  );
}
