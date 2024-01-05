import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityActivityLog from "./activity/UserPageIdentityActivityLog";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import ProfileRatersTableWrapper, {
  ProfileRatersParams,
} from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";

export default function UserPageIdentity({
  profile,
  profileIdentityStatements,
  initialCICReceivedParams,
  initialCICGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileIdentityStatements: CicStatement[];
  readonly initialCICReceivedParams: ProfileRatersParams;
  readonly initialCICGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements
        profile={profile}
        profileIdentityStatements={profileIdentityStatements}
      />

      <div className="tw-mt-6 lg:tw-mt-10 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-y-8 lg:tw-gap-y-10 tw-gap-x-8 lg:tw-gap-x-10">
        <div>
          <ProfileRatersTableWrapper initialParams={initialCICGivenParams} />
        </div>
        <div>
          <ProfileRatersTableWrapper initialParams={initialCICReceivedParams} />
        </div>
      </div>

      <div className="tw-mt-8 lg:tw-mt-10">
        <UserPageIdentityActivityLog
          initialActivityLogParams={initialActivityLogParams}
        />
      </div>
    </div>
  );
}
