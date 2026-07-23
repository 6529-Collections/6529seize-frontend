"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { SidebarNavItem } from "@/components/navigation/navTypes";
import { isSidebarNavItemActive } from "./sidebarActive";

interface WebSidebarExpandableGroupProps {
  readonly name: string;
  readonly items: ReadonlyArray<SidebarNavItem>;
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
  const hasActiveItem = useMemo(
    () => items.some((item) => isSidebarNavItemActive(item, pathname)),
    [items, pathname]
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
        className={`tw-touch-action-manipulation tw-ml-[2.75rem] tw-flex tw-min-h-10 tw-w-[calc(100%-2.75rem)] tw-cursor-pointer tw-items-center tw-justify-between tw-rounded-xl tw-border-none tw-py-1 tw-pl-3 tw-pr-3 tw-text-left tw-text-sm tw-font-medium tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 ${
          hasActiveItem
            ? "tw-bg-iron-900 tw-text-white active:tw-text-white desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
            : "tw-bg-transparent tw-text-iron-400 active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
        }`}
        aria-expanded={expanded}
        aria-controls={`group-${name}`}
      >
        <span className="tw-min-w-0 tw-flex-1 tw-break-words">{name}</span>
        <ChevronRightIcon
          className={`tw-ml-3 tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform tw-duration-200 ${
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
          <div id={`group-${name}`} className="tw-mt-0.5">
            {items.map((item) => (
              <GroupLink key={item.name} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(WebSidebarExpandableGroup);

function GroupLink({
  item,
  pathname,
}: {
  readonly item: SidebarNavItem;
  readonly pathname: string | null;
}) {
  const active = isSidebarNavItemActive(item, pathname);

  return (
    <Link
      href={item.href}
      className={`tw-touch-action-manipulation tw-ml-[2.75rem] tw-flex tw-min-h-9 tw-w-[calc(100%-2.75rem)] tw-cursor-pointer tw-items-center tw-justify-start tw-rounded-xl tw-border-none tw-py-2 tw-pl-3 tw-pr-3 tw-text-sm tw-font-medium tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 ${
        active
          ? "tw-bg-iron-900 tw-text-white active:tw-text-white desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
          : "tw-bg-transparent tw-text-iron-400 active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="tw-min-w-0 tw-break-words">{item.name}</span>
    </Link>
  );
}
