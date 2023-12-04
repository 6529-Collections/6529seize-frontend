import { useRouter } from "next/router";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import UserPageIdentityStatementsStatement from "./UserPageIdentityStatementsStatement";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { amIUser } from "../../../../../helpers/Helpers";

export default function UserPageIdentityStatementsStatementsList({
  statements,
  profile,
}: {
  statements: CicStatement[];
  profile: IProfileAndConsolidations;
  }) {
    const { address } = useAccount();
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

    useEffect(
      () => setIsMyProfile(amIUser({ profile, address })),
      [profile, address]
    );
  return (
    <ul className="tw-mt-4 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
      {statements.map((statement) => (
        <UserPageIdentityStatementsStatement
          key={statement.id}
          statement={statement}
          profile={profile}
          isMyProfile={isMyProfile}
        />
      ))}
    </ul>
  );
}
