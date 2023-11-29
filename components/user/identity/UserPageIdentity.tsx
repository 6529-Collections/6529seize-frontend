import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserPageIdentityAddStatements from "./UserPageIdentityAddStatements";
import UserPageIdentityAddStatementsContact from "./UserPageIdentityAddStatementsContact";
import UserPageIdentityAddStatementsSocialMediaAccount from "./UserPageIdentityAddStatementsSocialMediaAccount";
import UserPageIdentityStatements from "./UserPageIdentityStatements";
import UserPageIdentityHeader from "./header/UserPageIdentityHeader";

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
        <UserPageIdentityAddStatements />
      </div>
      <div >
        <UserPageIdentityAddStatementsSocialMediaAccount />
      </div>
      <div className="tw-hidden">
        <UserPageIdentityAddStatementsContact />
      </div>
    </div>
  );
}
