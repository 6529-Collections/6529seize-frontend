import type { CicStatement } from "@/entities/IProfile";
import UserPageIdentityStatementsStatementsList from "../utils/UserPageIdentityStatementsStatementsList";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageIdentityStatementsNFTAccounts({
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
        NFT Accounts
      </span>
      <UserPageIdentityStatementsStatementsList
        statements={statements}
        profile={profile}
        noItemsMessage="No NFT Account added yet"
        loading={loading}
      />
    </div>
  );
}
