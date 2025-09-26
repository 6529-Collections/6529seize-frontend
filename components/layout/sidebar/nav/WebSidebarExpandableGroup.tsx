"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface WebSidebarExpandableGroupProps {
  readonly name: string;
  readonly items: ReadonlyArray<{ name: string; href: string }>;
  readonly pathname: string | null;
  readonly expanded: boolean;
  readonly onToggle: (isExpanded: boolean) => void;
}

function WebSidebarExpandableGroup({
  name,
  items,
  pathname,
  expanded,
  onToggle,
}: WebSidebarExpandableGroupProps) {

  // Memoized helper to check if link is active
  const isActive = useCallback((href: string) => pathname === href, [pathname]);

  // Memoized check if any item in group is active
  const hasActiveItem = useMemo(() =>
    items.some((item) => isActive(item.href)),
    [items, isActive]
  );

  // Memoized toggle handler
  const handleToggle = useCallback(() => {
    onToggle(!expanded);
  }, [expanded, onToggle]);

  return (
    <div>
      {/* Group header with expand button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`tw-w-[calc(100%-2.75rem)] tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-pl-3 tw-pr-3 tw-ml-[2.75rem] tw-h-11 tw-justify-between tw-text-base tw-touch-action-manipulation ${
          hasActiveItem
            ? "tw-text-white tw-bg-iron-900 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-bg-iron-900 active:tw-text-white"
            : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
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

      {/* Group items - Animated container */}
      <div
        className={`tw-grid tw-transition-[grid-template-rows] tw-duration-300 tw-ease-out ${
          expanded ? "tw-grid-rows-[1fr]" : "tw-grid-rows-[0fr]"
        }`}
      >
        <div className="tw-overflow-hidden">
          <div id={`group-${name}`} className="tw-mt-1">
            {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`tw-w-[calc(100%-2.75rem)] tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-pl-3 tw-pr-3 tw-ml-[2.75rem] tw-h-11 tw-text-base tw-touch-action-manipulation ${
                isActive(item.href)
                  ? "tw-text-white tw-bg-iron-900 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-bg-iron-900 active:tw-text-white"
                  : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(WebSidebarExpandableGroup);
