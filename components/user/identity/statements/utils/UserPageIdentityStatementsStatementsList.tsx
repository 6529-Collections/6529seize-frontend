import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import UserPageIdentityStatementsStatement from "./UserPageIdentityStatementsStatement";

export default function UserPageIdentityStatementsStatementsList({
  statements,
  profile,
}: {
  statements: CicStatement[];
  profile: IProfileAndConsolidations;
}) {
  return (
    <ul className="tw-mt-4 tw-list-none tw-space-y-4 tw-pl-0 tw-text-base tw-leading-7 tw-text-gray-600">
      {statements.map((statement) => (
        <UserPageIdentityStatementsStatement
          key={statement.id}
          statement={statement}
          profile={profile}
        />
      ))}
    </ul>
  );
}
