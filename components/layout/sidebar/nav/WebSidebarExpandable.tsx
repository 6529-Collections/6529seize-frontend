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
  const isActive = (href: string) => pathname === href;

  const activeSubsection = section.subsections?.find(sub =>
    sub.items.some(item => isActive(item.href))
  )?.name || null;

  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(null);

  useEffect(() => {
    setExpandedSubsection(activeSubsection);
  }, [activeSubsection]);

  const handleSubsectionToggle = useCallback((subsectionName: string, isExpanded: boolean) => {
    setExpandedSubsection(isExpanded ? subsectionName : null);
  }, []);

  const hasActiveItem = useMemo(() => {
    if (section.items.some((item) => pathname === item.href)) return true;
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
            <fieldset
              id={`section-${section.key}`}
              className="tw-relative tw-p-0 tw-m-0 tw-border-0"
            >
              {/* Vertical connector line */}
              <div
                className={`tw-absolute tw-left-7 tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-800 tw-transition-opacity tw-duration-300 ${
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
            </fieldset>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(WebSidebarExpandable);
