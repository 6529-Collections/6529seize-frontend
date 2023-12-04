import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityCICRatings from "./UserPageIdentityCICRatings";
import UserPageIdentityActivityLog from "./UserPageIdentityActivityLog";
import UserPageIdentityDeleteStatementModal from "./statements/utils/UserPageIdentityDeleteStatementModal";

export default function UserPageIdentity({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements profile={profile} />
      <div className="tw-mt-10 tw-grid tw-grid-cols-2 tw-gap-x-10">
        <div>
          <UserPageIdentityCICRatings />
        </div>
        <div>
          <UserPageIdentityActivityLog />
        </div>
       <UserPageIdentityDeleteStatementModal />
      </div>
    </div>
  );
}
