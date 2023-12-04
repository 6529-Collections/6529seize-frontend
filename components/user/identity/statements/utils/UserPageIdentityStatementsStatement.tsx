import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import SocialStatementIcon from "../../../utils/icons/SocialStatementIcon";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";

export default function UserPageIdentityStatementsStatement({
  statement,
  profile,
  isMyProfile,
}: {
  statement: CicStatement;
  profile: IProfileAndConsolidations;
  isMyProfile: boolean;
}) {
  return (
    <li
      className={`${
        isMyProfile ? "tw-cursor-pointer hover:tw-text-neutral-400" : ""
      } tw-group -tw-ml-1 tw-inline-flex tw-h-8 tw-px-1.5 tw-rounded-lg tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className="tw-inline-flex tw-items-center tw-space-x-3">
        <div className="tw-cursor-pointer tw-w-6 tw-h-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
          <SocialStatementIcon statementType={statement.statement_type} />
        </div>
        <div className="tw-flex tw-items-center">
          <span>{statement.statement_value}</span>
        </div>
      </div>
      {isMyProfile && (
        <UserPageIdentityDeleteStatementButton
          statement={statement}
          profile={profile}
        />
      )}
    </li>
  );
}
