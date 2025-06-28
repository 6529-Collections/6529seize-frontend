"use client";

import { CicStatement } from "../../../../../entities/IProfile";
import UserPageIdentityStatementsStatement from "./UserPageIdentityStatementsStatement";
import { useContext, useEffect, useState } from "react";
import { amIUser } from "../../../../../helpers/Helpers";
import CommonSkeletonLoader from "../../../../utils/animation/CommonSkeletonLoader";
import { AuthContext } from "../../../../auth/Auth";
import { useSeizeConnectContext } from "../../../../auth/SeizeConnectContext";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
export default function UserPageIdentityStatementsStatementsList({
  statements,
  profile,
  noItemsMessage,
  loading,
}: {
  readonly statements: CicStatement[];
  readonly profile: ApiIdentity;
  readonly noItemsMessage: string;
  readonly loading: boolean;
}) {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  const getCanEdit = (): boolean => isMyProfile && !activeProfileProxy;
  const [canEdit, setCanEdit] = useState<boolean>(getCanEdit());
  useEffect(() => setCanEdit(getCanEdit()), [isMyProfile, activeProfileProxy]);

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
          canEdit={canEdit}
        />
      ))}

      {!statements.length && (
        <span className="tw-text-sm sm:tw-text-md tw-italic tw-text-iron-500">
          {noItemsMessage}
        </span>
      )}
    </ul>
  );
}
