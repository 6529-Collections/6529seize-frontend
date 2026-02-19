import type { CicStatement } from "@/entities/IProfile";
import UserPageIdentityStatementsStatementsList from "../utils/UserPageIdentityStatementsStatementsList";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

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
      <span className="tw-text-[11px] tw-font-semibold tw-text-iron-500 tw-uppercase tw-tracking-widest">
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
