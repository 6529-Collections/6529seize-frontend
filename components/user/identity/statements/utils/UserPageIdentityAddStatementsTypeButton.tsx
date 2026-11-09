"use client";

import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import { STATEMENT_META, STATEMENT_TYPE } from "@/helpers/Types";
import clsx from "clsx";
import type { TouchEvent } from "react";

export const ADD_STATEMENT_PLATFORM_TOOLTIP_ID =
  "add-statement-platform-tooltip";

const PLATFORM_ICON_SIZE_CLASSES: Partial<Record<STATEMENT_TYPE, string>> = {
  [STATEMENT_TYPE.FACEBOOK]: "[&>*]:tw-size-[18px]",
  [STATEMENT_TYPE.LINKED_IN]: "[&>*]:tw-size-[18px]",
  [STATEMENT_TYPE.LINKTREE]: "[&>*]:tw-size-[22px]",
};

export default function UserPageIdentityAddStatementsTypeButton({
  statementType,
  label,
  isActive,
  isFirst,
  isLast,
  onClick,
}: {
  readonly statementType: STATEMENT_TYPE;
  readonly label?: string | undefined;
  readonly isActive: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onClick: () => void;
}) {
  const title = label ?? STATEMENT_META[statementType].title;
  const onTouchStart = (event: TouchEvent<HTMLButtonElement>) => {
    // Platform taps must not start the parent sheet's swipe-to-dismiss
    // gesture. The picker tooltip handles the same tap independently.
    event.stopPropagation();
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={onTouchStart}
      type="button"
      aria-pressed={isActive}
      data-tooltip-id={ADD_STATEMENT_PLATFORM_TOOLTIP_ID}
      data-tooltip-content={title}
      className={clsx(
        "tw-relative -tw-ml-px tw-flex tw-h-[52px] tw-min-h-11 tw-min-w-0 tw-flex-1 tw-touch-manipulation tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition-colors tw-duration-300 tw-ease-out focus:tw-outline-none focus-visible:tw-z-20 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 motion-reduce:tw-transition-none",
        isFirst && "tw-rounded-l-md",
        isLast && "tw-rounded-r-md",
        isActive
          ? "tw-z-10 tw-bg-iron-800 tw-ring-2 tw-ring-primary-400"
          : "desktop-hover:hover:tw-bg-iron-800"
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "tw-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center [&>*]:tw-object-contain",
          PLATFORM_ICON_SIZE_CLASSES[statementType] ?? "[&>*]:tw-size-5"
        )}
      >
        <SocialStatementIcon statementType={statementType} />
      </span>
      <span className="tw-sr-only">{title}</span>
    </button>
  );
}
