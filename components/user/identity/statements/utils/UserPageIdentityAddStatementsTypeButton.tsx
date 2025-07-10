"use client";

import { useEffect, useState } from "react";
import { STATEMENT_META, STATEMENT_TYPE } from "../../../../../helpers/Types";
import SocialStatementIcon from "../../../utils/icons/SocialStatementIcon";

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
  const getActivityClass = () =>
    isActive ? "tw-bg-iron-800" : "tw-bg-transparent";

  const getPositionClass = () => {
    if (isFirst) {
      return "tw-rounded-l-md";
    } else if (isLast) {
      return "tw-rounded-r-md";
    }
    return "";
  };

  const getDynamicClasses = () => `${getActivityClass()} ${getPositionClass()}`;
  const [dynamicClasses, setDynamicClasses] = useState(getDynamicClasses());

  useEffect(() => {
    setDynamicClasses(getDynamicClasses());
  }, [isActive, isFirst, isLast]);

  return (
    <button
      onClick={onClick}
      type="button"
      className={`${dynamicClasses} tw-relative -tw-ml-px tw-flex tw-items-center tw-justify-center tw-flex-1 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-50 tw-border-none tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-focus:tw-z-10`}>
      <div className="tw-flex-shrink-0 tw-w-5 tw-h-5">
        <SocialStatementIcon statementType={statementType} />
      </div>
      <span className="tw-sr-only">{STATEMENT_META[statementType].title}</span>
    </button>
  );
}
