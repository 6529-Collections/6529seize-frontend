"use client";

import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import { STATEMENT_META, type STATEMENT_TYPE } from "@/helpers/Types";
import clsx from "clsx";

export default function UserPageIdentityAddStatementsTypeButton({
  statementType,
  isActive,
  onClick,
}: {
  readonly statementType: STATEMENT_TYPE;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-pressed={isActive}
      className={clsx(
        "tw-flex tw-min-h-12 tw-min-w-0 tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400",
        isActive
          ? "tw-border-primary-400/50 tw-bg-primary-500/10 tw-text-white"
          : "tw-border-white/10 tw-bg-white/[0.035] desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.07]"
      )}
    >
      <span className="tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center">
        <SocialStatementIcon statementType={statementType} />
      </span>
      <span className="tw-min-w-0 tw-truncate">
        {STATEMENT_META[statementType].title}
      </span>
    </button>
  );
}
