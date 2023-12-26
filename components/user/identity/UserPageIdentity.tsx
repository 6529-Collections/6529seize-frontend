import {
  CicStatement,
  IProfileAndConsolidations,
  ProfilesMatterRatingWithRaterLevel,
} from "../../../entities/IProfile";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityCICRatings from "./ratings/UserPageIdentityCICRatings";
import UserPageIdentityActivityLog from "./activity/UserPageIdentityActivityLog";
import { Page } from "../../../helpers/Types";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";

export default function UserPageIdentity({
  profile,
  profileCICRatings,
  profileIdentityStatements,
  initialActivityLogParams,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileCICRatings: Page<ProfilesMatterRatingWithRaterLevel>;
  readonly profileIdentityStatements: CicStatement[];
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements
        profile={profile}
        profileIdentityStatements={profileIdentityStatements}
      />
      <div className="tw-mt-10 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-y-10 tw-gap-x-10">
        <div>
          <UserPageIdentityCICRatings profileCICRatings={profileCICRatings} />
        </div>
        <div>
          <UserPageIdentityActivityLog
            initialActivityLogParams={initialActivityLogParams}
          />
        </div>
      </div>
    </div>
  );
}
