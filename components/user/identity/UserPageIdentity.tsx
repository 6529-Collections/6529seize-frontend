import {
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfilesMatterRatingWithRaterLevel,
} from "../../../entities/IProfile";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityCICRatings from "./ratings/UserPageIdentityCICRatings";
import UserPageIdentityActivityLog from "./activity/UserPageIdentityActivityLog";
import { Page } from "../../../helpers/Types";

export default function UserPageIdentity({
  profile,
  profileActivityLogs,
  profileCICRatings,
  profileIdentityStatements,
}: {
  profile: IProfileAndConsolidations;
  profileActivityLogs: Page<ProfileActivityLog>;
  profileCICRatings: Page<ProfilesMatterRatingWithRaterLevel>;
  profileIdentityStatements: CicStatement[];
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
          <UserPageIdentityCICRatings
            profile={profile}
            profileCICRatings={profileCICRatings}
          />
        </div>
        <div>
          <UserPageIdentityActivityLog
            profile={profile}
            profileActivityLogs={profileActivityLogs}
          />
        </div>
      </div>
    </div>
  );
}
