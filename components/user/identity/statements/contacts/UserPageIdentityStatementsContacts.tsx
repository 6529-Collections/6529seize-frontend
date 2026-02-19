import type { CicStatement } from "@/entities/IProfile";
import UserPageIdentityStatementsStatementsList from "../utils/UserPageIdentityStatementsStatementsList";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageIdentityStatementsContacts({
  statements,
  profile,
  loading,
}: {
  readonly statements: CicStatement[];
  readonly profile: ApiIdentity;
  readonly loading: boolean;
}) {
  return (
    <div>
      <span className="tw-text-[10px] tw-font-semibold tw-text-iron-600 tw-uppercase tw-tracking-widest">
        Contact
      </span>
      <UserPageIdentityStatementsStatementsList
        statements={statements}
        profile={profile}
        noItemsMessage="No Contact added yet"
        loading={loading}
      />
    </div>
  );
}
