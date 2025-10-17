import { use } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CicStatement } from "@/entities/IProfile";
import UserPageIdentityStatements from "@/components/user/identity/statements/UserPageIdentityStatements";

export function IdentityStatementsSection({
  profile,
  handleOrWallet,
  resource,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly resource: Promise<CicStatement[]>;
}): React.JSX.Element {
  const statements = use(resource);
  return (
    <UserPageIdentityStatements
      profile={profile}
      handleOrWallet={handleOrWallet}
      initialStatements={statements}
    />
  );
}
