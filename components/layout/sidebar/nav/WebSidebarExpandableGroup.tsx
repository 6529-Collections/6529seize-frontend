"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface WebSidebarExpandableGroupProps {
  name: string;
  items: Array<{ name: string; href: string }>;
  pathname: string | null;
}

function WebSidebarExpandableGroup({
  name,
  items,
  pathname,
}: WebSidebarExpandableGroupProps) {
  const [expanded, setExpanded] = useState(false);

  // Check if link is active
  const isActive = (href: string) => pathname === href;

  // Check if any item in group is active
  const hasActiveItem = items.some((item) => isActive(item.href));

  return (
    <div>
      {/* Group header with expand button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-pr-3 tw-pl-[3.25rem] tw-h-11 tw-justify-between desktop-hover:hover:tw-bg-iron-900 tw-text-base ${
          hasActiveItem
            ? "tw-text-white desktop-hover:hover:tw-text-white tw-bg-transparent"
            : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
        }`}
        aria-expanded={expanded}
        aria-controls={`group-${name}`}
      >
        <span>{name}</span>
        <ChevronRightIcon
          className={`tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform tw-duration-200 ${
            expanded ? "tw-rotate-90" : ""
          }`}
        />
      </button>

      {/* Group items */}
      {expanded && (
        <div id={`group-${name}`} className="tw-mt-1">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-pr-3 tw-pl-[3.25rem] tw-h-11 tw-text-base ${
                isActive(item.href)
                  ? "tw-text-white desktop-hover:hover:tw-text-white tw-bg-transparent"
                  : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(WebSidebarExpandableGroup);
