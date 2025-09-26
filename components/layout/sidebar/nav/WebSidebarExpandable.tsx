"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import WebSidebarNavItem from "./WebSidebarNavItem";
import WebSidebarExpandableGroup from "./WebSidebarExpandableGroup";
import { SidebarSection } from "@/components/navigation/navTypes";

interface WebSidebarExpandableProps {
  readonly section: SidebarSection;
  readonly expanded: boolean;
  readonly onToggle: (e?: React.MouseEvent) => void;
  readonly collapsed: boolean;
  readonly pathname: string | null;
  readonly 'data-section'?: string;
}

function WebSidebarExpandable({
  section,
  expanded,
  onToggle,
  collapsed,
  pathname,
  'data-section': dataSection,
}: WebSidebarExpandableProps) {
  // Helper to check active routes
  const isActive = (href: string) => pathname === href;

  // Compute which subsection has the active item
  const activeSubsection = section.subsections?.find(sub =>
    sub.items.some(item => isActive(item.href))
  )?.name || null;

  // Track which subsection is expanded (only one at a time)
  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(null);

  // Sync expanded subsection with active route
  useEffect(() => {
    setExpandedSubsection(activeSubsection);
  }, [activeSubsection]);

  // Handle subsection toggle - closes others when opening one
  const handleSubsectionToggle = useCallback((subsectionName: string, isExpanded: boolean) => {
    setExpandedSubsection(isExpanded ? subsectionName : null);
  }, []);

  // Check if section has any active item - memoized since section changes rarely
  const hasActiveItem = useMemo(() => {
    // Check direct items
    if (section.items.some((item) => pathname === item.href)) return true;
    // Check subsection items
    if (
      section.subsections?.some((sub) =>
        sub.items.some((item) => pathname === item.href)
      )
    )
      return true;
    return false;
  }, [section.items, section.subsections, pathname]);

  return (
    <>
      {/* Main section header */}
      <WebSidebarNavItem
        onClick={(e) => onToggle(e)}
        icon={section.icon}
        label={section.name}
        active={hasActiveItem}
        collapsed={collapsed}
        ariaExpanded={expanded}
        ariaControls={`section-${section.key}`}
        data-section={dataSection}
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

      {/* Section Children - Animated container */}
      {!collapsed && (
        <div
          className={`tw-grid tw-transition-[grid-template-rows] tw-duration-300 tw-ease-out ${
            expanded ? "tw-grid-rows-[1fr]" : "tw-grid-rows-[0fr]"
          }`}
        >
          <div className="tw-overflow-hidden">
            <div id={`section-${section.key}`} role="group" className="tw-relative">
              {/* Vertical connector line */}
              <div
                className={`tw-absolute tw-left-6 tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-800 tw-transition-opacity tw-duration-300 ${
                  expanded ? "tw-opacity-100" : "tw-opacity-0"
                }`}
                aria-hidden="true"
              />

              {/* Direct items */}
              {section.items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`tw-w-[calc(100%-2.75rem)] tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-ml-[2.75rem] tw-pl-3 tw-pr-3 tw-h-11 tw-text-base tw-touch-action-manipulation ${
                isActive(item.href)
                  ? "tw-text-white tw-bg-iron-900 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-bg-iron-900 active:tw-text-white"
                  : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
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
                  expanded={expandedSubsection === subsection.name || activeSubsection === subsection.name}
                  onToggle={(isExpanded) => handleSubsectionToggle(subsection.name, isExpanded)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(WebSidebarExpandable);
