import { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CountlessPage, Page } from "@/helpers/Types";
import {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import ProfileRatersTableWrapper, {
  ProfileRatersParams,
} from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageIdentityActivityLog from "./activity/UserPageIdentityActivityLog";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";

export default function UserPageIdentity({
  profile,
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
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements
        profile={profile}
        handleOrWallet={handleOrWallet}
        initialStatements={initialStatements}
      />

      <div className="tw-mt-6 lg:tw-mt-10 xl:tw-flex xl:tw-items-stretch tw-space-y-8 lg:tw-space-y-10 xl:tw-space-y-0 tw-gap-x-8">
        <ProfileRatersTableWrapper
          initialParams={initialCICGivenParams}
          handleOrWallet={handleOrWallet}
          initialData={initialCicGivenData}
        />
        <ProfileRatersTableWrapper
          initialParams={initialCICReceivedParams}
          handleOrWallet={handleOrWallet}
          initialData={initialCicReceivedData}
        />
      </div>

      <div className="tw-mt-8 lg:tw-mt-10">
        <UserPageIdentityActivityLog
          initialActivityLogParams={initialActivityLogParams}
          initialActivityLogData={initialActivityLogData}
        />
      </div>
    </div>
  );
}
