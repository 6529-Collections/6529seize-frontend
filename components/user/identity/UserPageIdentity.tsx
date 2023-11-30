import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityAddStatements from "./UserPageIdentityAddStatements";
import UserPageIdentityAddStatementsContact from "./UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./UserPageIdentityAddStatementsSocialMediaAccount";
import UserPageIdentityStatements from "./statements/UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";
import UserPageIdentityCICRatings from "./UserPageIdentityCICRatings";
import UserPageIdentityActivityLog from "./UserPageIdentityActivityLog";

export default function UserPageIdentity({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tailwind-scope">
      <UserPageIdentityHeader profile={profile} />
      <UserPageIdentityStatements />

      <div className="tw-hidden">
        <UserPageIdentityAddStatementsSocialMediaAccount />
      </div>
      <div className="tw-hidden">
        <UserPageIdentityAddStatementsContact />
      </div>

      <div className="tw-mt-10 tw-grid tw-grid-cols-2 tw-gap-x-10">
        <div>
          <UserPageIdentityCICRatings />
        </div>
        <div>
          <UserPageIdentityActivityLog />
        </div>
      </div>
    </div>
  );
}
