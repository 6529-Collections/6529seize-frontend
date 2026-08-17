"use client";

import type { CicStatement } from "@/entities/IProfile";
import UserPageIdentityStatementsStatement from "./UserPageIdentityStatementsStatement";
import { useContext } from "react";
import { amIUser } from "@/helpers/Helpers";
import CommonSkeletonLoader from "@/components/utils/animation/CommonSkeletonLoader";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const canEdit = amIUser({ profile, address }) && !activeProfileProxy;

  if (loading) {
    return (
      <output
        aria-label={t(locale, "user.profile.identity.statements.loading")}
        className="tw-block tw-pt-2"
      >
        <CommonSkeletonLoader />
      </output>
    );
  }

  return (
    <ul className="tw-mb-0 tw-mt-2 tw-inline-flex tw-w-full tw-list-none tw-flex-col tw-space-y-0 tw-pl-0 tw-text-base tw-text-iron-300">
      {statements.map((statement) => (
        <UserPageIdentityStatementsStatement
          key={statement.id}
          statement={statement}
          profile={profile}
          canEdit={canEdit}
        />
      ))}

      {!statements.length && (
        <li className="tw-text-xs tw-font-normal tw-text-iron-500">
          {noItemsMessage}
        </li>
      )}
    </ul>
  );
}
