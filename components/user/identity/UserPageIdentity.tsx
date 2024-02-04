import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityActivityLog from "./activity/UserPageIdentityActivityLog";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import ProfileRatersTableWrapper, {
  ProfileRatersParams,
} from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";

export default function UserPageIdentity({
  profile,
  initialCICReceivedParams,
  initialCICGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly initialCICReceivedParams: ProfileRatersParams;
  readonly initialCICGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements profile={profile} />

      <div className="tw-mt-6 lg:tw-mt-10 xl:tw-flex tw-items-stretch tw-space-y-8 xl:tw-space-y-0 tw-gap-x-8 lg:tw-gap-x-10">
        <ProfileRatersTableWrapper initialParams={initialCICGivenParams} />
        <ProfileRatersTableWrapper initialParams={initialCICReceivedParams} />
      </div>

      <div className="tw-mt-8 lg:tw-mt-10">
        <UserPageIdentityActivityLog
          initialActivityLogParams={initialActivityLogParams}
        />
      </div>
    </div>
  );
}
