"use client";

import type { CicStatement } from "@/entities/IProfile";
import { useState } from "react";

export default function UserPageHeaderAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!statement) {
    return (
      <div className="tw-text-sm tw-italic tw-text-white/40 tw-transition tw-duration-200 group-focus-within:tw-text-white/70 group-hover:tw-text-white/70">
        Click to add an About statement
      </div>
    );
  }

  const showToggle = statement.statement_value.length > 240;
  const clampClass = expanded
    ? "tw-line-clamp-none"
    : "tw-line-clamp-6 md:tw-line-clamp-none";

  return (
    <div className="tw-space-y-2">
      <div
        className={`tw-mb-0 tw-whitespace-pre-line tw-text-md tw-font-normal tw-leading-relaxed tw-text-zinc-300 ${clampClass}`}
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
          className="tw-border-0 tw-bg-transparent tw-px-1 tw-py-1 tw-text-sm tw-font-semibold tw-text-white/80 tw-transition tw-duration-200 tw-ease-out hover:tw-text-white md:tw-hidden"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
