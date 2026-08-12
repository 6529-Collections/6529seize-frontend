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
      {canEditStatements && (
        <div className="tw-mt-5 tw-flex tw-justify-end">
          <UserPageIdentityStatementsAddButton profile={profile} />
        </div>
      )}
      <div
        className={`tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0f1014] ${
          canEditStatements ? "tw-mt-3" : "tw-mt-5"
        }`}
      >
        <UserPageIdentityStatements profile={profile} />
      </div>
    </>
  );
}
