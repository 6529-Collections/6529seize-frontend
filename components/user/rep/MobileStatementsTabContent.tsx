import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityStatementsAddButton from "../identity/statements/add/UserPageIdentityStatementsAddButton";
import UserPageIdentityStatements from "../identity/statements/UserPageIdentityStatements";

export default function MobileStatementsTabContent({
  profile,
  canEditStatements,
}: {
  readonly profile: ApiIdentity;
  readonly canEditStatements: boolean;
}) {
  return (
    <>
      <h3 className="tw-sr-only">ID Statements</h3>
      <div className="tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0f1014]">
        <UserPageIdentityStatements
          profile={profile}
          headerAction={
            canEditStatements ? (
              <UserPageIdentityStatementsAddButton
                profile={profile}
                size="sm"
              />
            ) : undefined
          }
        />
      </div>
    </>
  );
}
