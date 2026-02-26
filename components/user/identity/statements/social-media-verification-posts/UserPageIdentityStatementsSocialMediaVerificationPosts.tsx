import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

import UserPageIdentityStatementsStatementsList from "../utils/UserPageIdentityStatementsStatementsList";

export default function UserPageIdentityStatementsSocialMediaVerificationPosts({
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
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        Social Media Verification Posts
      </span>
      <UserPageIdentityStatementsStatementsList
        statements={statements}
        profile={profile}
        noItemsMessage="No Social Media Verification Post added yet"
        loading={loading}
      />
    </div>
  );
}
