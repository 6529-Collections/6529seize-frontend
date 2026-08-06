"use client";

import type { CicStatement } from "@/entities/IProfile";
import { useEffect, useRef, useState } from "react";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const statementElement = statementRef.current;
    if (!statementElement || !statement || expanded) {
      return;
    }

    const updateOverflow = () => {
      setHasOverflow(
        statementElement.scrollHeight > statementElement.clientHeight + 1
      );
    };

    updateOverflow();
    if (typeof ResizeObserver === "undefined") {
      globalThis.addEventListener("resize", updateOverflow);
      return () => globalThis.removeEventListener("resize", updateOverflow);
    }

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(statementElement);

    return () => resizeObserver.disconnect();
  }, [expanded, statement]);

  if (!statement) {
    return (
      <div className="tw-text-sm tw-italic tw-text-iron-500 tw-transition tw-duration-200 group-focus-within:tw-text-iron-300 group-hover:tw-text-iron-300">
        {getUserProfileHeaderMessage("user.profileHeader.about.empty")}
      </div>
    );
  }

  const showToggle = expanded || hasOverflow;
  const clampClass = expanded
    ? "tw-line-clamp-none"
    : "tw-line-clamp-6 md:tw-line-clamp-none";

  return (
    <div className="tw-space-y-2">
      <div
        ref={statementRef}
        className={`tw-mb-0 tw-whitespace-pre-line tw-text-md tw-font-normal tw-leading-relaxed tw-text-iron-400 ${clampClass}`}
      >
        {statement.statement_value}
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
