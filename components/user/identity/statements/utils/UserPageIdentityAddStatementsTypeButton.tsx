"use client";

import { STATEMENT_META, STATEMENT_TYPE } from "@/helpers/Types";
import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";

export default function UserPageIdentityAddStatementsTypeButton({
  statementType,
  isActive,
  isFirst,
  isLast,
  onClick,
}: {
  readonly statementType: STATEMENT_TYPE;
  readonly isActive: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onClick: () => void;
}) {
  const activityClass = isActive ? "tw-bg-iron-800" : "tw-bg-transparent";
  const positionClass = isFirst
    ? "tw-rounded-l-md"
    : isLast
      ? "tw-rounded-r-md"
      : "";
  const dynamicClasses = [activityClass, positionClass]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      onClick={onClick}
      type="button"
      className={`${dynamicClasses} tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-border-none tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10`}>
      <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
        <SocialStatementIcon statementType={statementType} />
      </div>
      <span className="tw-sr-only">{STATEMENT_META[statementType].title}</span>
    </button>
  );
}
