"use client";

import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import WebSidebarNavItem from "./WebSidebarNavItem";
import { SidebarSection } from "@/components/navigation/navTypes";

interface WebSidebarExpandableItemProps {
  readonly section: SidebarSection;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly collapsed: boolean;
  readonly pathname: string | null;
}

function WebSidebarExpandableItem({
  section,
  expanded,
  onToggle,
  collapsed,
  pathname,
}: WebSidebarExpandableItemProps) {
  // Helper to check active routes
  const isActiveRoute = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  // Check if any item in this section is active
  const sectionHasActiveItem =
    section.items.some((item) => isActiveRoute(item.href)) ||
    section.subsections?.some((subsection) =>
      subsection.items.some((item) => isActiveRoute(item.href))
    ) ||
    false;

  return (
    <>
      {/* Section row using WebSidebarNavItem */}
      <WebSidebarNavItem
        onClick={onToggle}
        icon={section.icon}
        label={section.name}
        active={sectionHasActiveItem}
        collapsed={collapsed}
        ariaExpanded={expanded}
        ariaControls={`section-${section.key}`}
        rightSlot={
          !collapsed && (
            <ChevronRightIcon
              className={`tw-h-4 tw-w-4 tw-shrink-0 tw-ml-auto tw-transition-transform tw-duration-200 ${
                expanded ? "tw-rotate-90" : ""
              }`}
            />
          )
        }
      />

      {/* Section Children - Only render when expanded */}
      {expanded && !collapsed && (
        <div id={`section-${section.key}`} className="tw-mt-2" role="group">
          {/* Direct items */}
          {section.items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={` desktop-hover:hover:tw-bg-iron-900 tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-11 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-pr-3 tw-pl-12 ${
                isActiveRoute(item.href)
                  ? "tw-text-white desktop-hover:hover:tw-text-white"
                  : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-text-white"
              }`}
              aria-current={isActiveRoute(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}

          {/* Subsections */}
          {section.subsections?.map((subsection) => (
            <div key={subsection.name}>
              <div className="tw-pl-12 tw-pt-5 tw-mt-2 tw-flex tw-items-end tw-text-xs tw-font-medium tw-text-iron-600 tw-uppercase tw-tracking-wider tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0">
                {subsection.name}
              </div>
              <div className="tw-mt-2">
                {subsection.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-11 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-pr-3 tw-pl-12 tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-transparent ${
                      isActiveRoute(item.href)
                        ? "tw-text-white desktop-hover:hover:tw-text-white"
                        : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
                    }`}
                    aria-current={isActiveRoute(item.href) ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default React.memo(WebSidebarExpandableItem);
