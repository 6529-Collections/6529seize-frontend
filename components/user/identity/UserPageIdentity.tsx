import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityAddStatements from "./statements/UserPageIdentityAddStatements";
import UserPageIdentityAddStatementsContact from "./statements/contact/UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./statements/social-media/UserPageIdentityAddStatementsSocialMediaAccount";
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
      <UserPageIdentityStatements profile={profile} />

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
