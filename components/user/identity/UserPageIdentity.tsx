import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityCICRatings from "./UserPageIdentityCICRatings";
import UserPageIdentityActivityLog from "./activity/UserPageIdentityActivityLog";

export default function UserPageIdentity({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements profile={profile} />
      <div className="tw-mt-10 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-y-10 tw-gap-x-10">
        <div>
          <UserPageIdentityCICRatings />
        </div>
        <div>
          <UserPageIdentityActivityLog profile={profile} />
        </div>
      </div>
    </div>
  );
}
