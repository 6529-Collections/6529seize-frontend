"use client";

import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import DesktopSidebarNavItem from "./DesktopSidebarNavItem";
import { SidebarSection } from "@/components/navigation/navTypes";

interface DesktopSidebarExpandableItemProps {
  readonly section: SidebarSection;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly collapsed: boolean;
  readonly pathname: string | null;
}

export default function DesktopSidebarExpandableItem({
  section,
  expanded,
  onToggle,
  collapsed,
  pathname,
}: DesktopSidebarExpandableItemProps) {
  // Helper to check active routes
  const isActiveRoute = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");
  
  // Check if any item in this section is active
  const sectionHasActiveItem = 
    section.items.some(item => isActiveRoute(item.href)) ||
    section.subsections?.some(subsection => 
      subsection.items.some(item => isActiveRoute(item.href))
    ) || false;

  return (
    <>
      {/* Section row using DesktopSidebarNavItem */}
      <DesktopSidebarNavItem
        onClick={onToggle}
        icon={section.icon}
        label={section.name}
        active={expanded || sectionHasActiveItem}
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
        <div 
          id={`section-${section.key}`}
          className="tw-ml-6 tw-mt-2 tw-space-y-1"
          role="group"
        >
          {/* Direct items */}
          {section.items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-text-iron-300 tw-transition-colors tw-duration-200 tw-border tw-border-transparent desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-border-iron-700 tw-no-underline"
              aria-current={isActiveRoute(item.href) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}

          {/* Subsections */}
          {section.subsections?.map((subsection) => (
            <div key={subsection.name} className="tw-mt-4">
              <div className="tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-500 tw-uppercase tw-tracking-wider">
                {subsection.name}
              </div>
              <div className="tw-space-y-1">
                {subsection.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-text-iron-300 tw-transition-colors tw-duration-200 tw-border tw-border-transparent desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-border-iron-700 tw-no-underline"
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