"use client";

import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import WebSidebarNavItem from "./WebSidebarNavItem";
import WebSidebarExpandableGroup from "./WebSidebarExpandableGroup";
import { SidebarSection } from "@/components/navigation/navTypes";

interface WebSidebarExpandableProps {
  readonly section: SidebarSection;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly collapsed: boolean;
  readonly pathname: string | null;
}

function WebSidebarExpandable({
  section,
  expanded,
  onToggle,
  collapsed,
  pathname,
}: WebSidebarExpandableProps) {
  // Helper to check active routes
  const isActive = (href: string) => pathname === href;

  // Check if section has any active item
  const hasActiveItem = () => {
    // Check direct items
    if (section.items.some(item => isActive(item.href))) return true;
    // Check subsection items
    if (section.subsections?.some(sub =>
      sub.items.some(item => isActive(item.href))
    )) return true;
    return false;
  };

  return (
    <>
      {/* Main section header */}
      <WebSidebarNavItem
        onClick={onToggle}
        icon={section.icon}
        label={section.name}
        active={hasActiveItem()}
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
        <div id={`section-${section.key}`} role="group">
          {/* Direct items */}
          {section.items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-pr-3 tw-pl-[3.25rem] tw-h-11 tw-text-base ${
                isActive(item.href)
                  ? "tw-text-white desktop-hover:hover:tw-text-white"
                  : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
              }`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}

          {/* Subsections using WebSidebarExpandableGroup component */}
          {section.subsections?.map((subsection) => (
            <WebSidebarExpandableGroup
              key={subsection.name}
              name={subsection.name}
              items={subsection.items}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default React.memo(WebSidebarExpandable);
