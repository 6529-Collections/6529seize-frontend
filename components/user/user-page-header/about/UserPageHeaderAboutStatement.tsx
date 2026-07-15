"use client";

import type { CicStatement } from "@/entities/IProfile";
import { useState } from "react";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!statement) {
    return (
      <div className="tw-text-sm tw-font-medium tw-text-iron-500 tw-transition tw-duration-200 group-focus-within:tw-text-iron-300 desktop-hover:group-hover:tw-text-iron-300 motion-reduce:tw-transition-none">
        {getUserProfileHeaderMessage("user.profileHeader.about.empty")}
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
        className={`tw-mb-0 tw-whitespace-pre-line tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300 ${clampClass}`}
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
          className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none md:tw-hidden"
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
