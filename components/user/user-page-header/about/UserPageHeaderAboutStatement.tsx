"use client";

import type { CicStatement } from "@/entities/IProfile";
import { useCallback, useState, useSyncExternalStore } from "react";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

function useStatementOverflow(element: HTMLDivElement | null): boolean {
  const getSnapshot = useCallback(() => {
    if (!element) {
      return false;
    }

    return element.scrollHeight > element.clientHeight + 1;
  }, [element]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!element) {
        return () => {};
      }

      if (typeof ResizeObserver === "undefined") {
        globalThis.addEventListener("resize", onStoreChange);
        return () => globalThis.removeEventListener("resize", onStoreChange);
      }

      const resizeObserver = new ResizeObserver(onStoreChange);
      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
    },
    [element]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function UserPageHeaderAboutStatementContent({
  statementValue,
}: {
  readonly statementValue: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [statementElement, setStatementElement] =
    useState<HTMLDivElement | null>(null);
  const hasOverflow = useStatementOverflow(statementElement);

  const showToggle = expanded || hasOverflow;
  const clampClass = expanded
    ? "tw-line-clamp-none"
    : "tw-line-clamp-6 md:tw-line-clamp-none";

  return (
    <div className="tw-space-y-2">
      <div
        ref={setStatementElement}
        className={`tw-mb-0 tw-whitespace-pre-line tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400 sm:tw-text-md sm:tw-leading-6 ${clampClass}`}
      >
        {statementValue}
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          aria-expanded={expanded}
          className="tw-border-0 tw-bg-transparent tw-px-1 tw-py-1 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out hover:tw-text-iron-50 md:tw-hidden"
        >
          {getUserProfileHeaderMessage(
            expanded
              ? "user.profileHeader.about.collapse"
              : "user.profileHeader.about.expand"
          )}
        </button>
      )}
    </div>
  );
}

export default function UserPageHeaderAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  if (!statement) {
    return (
      <div className="tw-text-sm tw-italic tw-text-iron-500 tw-transition tw-duration-200 group-focus-within:tw-text-iron-300 group-hover:tw-text-iron-300">
        {getUserProfileHeaderMessage("user.profileHeader.about.empty")}
      </div>
    );
  }

  return (
    <UserPageHeaderAboutStatementContent
      key={`${statement.id}:${statement.statement_value}`}
      statementValue={statement.statement_value}
    />
  );
}
