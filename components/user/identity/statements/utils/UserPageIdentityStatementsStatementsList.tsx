import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import UserPageIdentityStatementsStatement from "./UserPageIdentityStatementsStatement";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { amIUser } from "../../../../../helpers/Helpers";
import CommonSkeletonLoader from "../../../../utils/animation/CommonSkeletonLoader";

export default function UserPageIdentityStatementsStatementsList({
  statements,
  profile,
  noItemsMessage,
  loading,
}: {
  readonly statements: CicStatement[];
  readonly profile: IProfileAndConsolidations;
  readonly noItemsMessage: string;
  readonly loading: boolean;
}) {
  const { address } = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  if (loading) {
    return (
      <div className="tw-pt-2">
        <CommonSkeletonLoader />
      </div>
    );
  }

  return (
    <ul className="tw-mb-0 tw-mt-4 tw-list-none tw-space-y-2 tw-inline-flex tw-flex-col tw-pl-0 tw-text-base tw-leading-7 tw-text-iron-600">
      {statements.map((statement) => (
        <UserPageIdentityStatementsStatement
          key={statement.id}
          statement={statement}
          profile={profile}
          isMyProfile={isMyProfile}
        />
      ))}

      {!statements.length && (
        <span className="tw-text-sm tw-italic tw-text-iron-500">
          {noItemsMessage}
        </span>
      )}
    </ul>
  );
}
