"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  readonly "data-section"?: string;
}

function WebSidebarExpandable({
  section,
  expanded,
  onToggle,
  collapsed,
  pathname,
  "data-section": dataSection,
}: WebSidebarExpandableProps) {
  const isActive = (href: string) => pathname === href;

  const activeSubsection =
    section.subsections?.find((sub) =>
      sub.items.some((item) => isActive(item.href))
    )?.name ?? null;

  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(
    () => activeSubsection
  );

  useEffect(() => {
    setExpandedSubsection(activeSubsection);
  }, [activeSubsection, pathname]);

  const handleSubsectionToggle = useCallback(
    (subsectionName: string, isNowExpanded: boolean) => {
      setExpandedSubsection(isNowExpanded ? subsectionName : null);
    },
    []
  );

  const hasActiveItem = useMemo(() => {
    if (section.items.some((item) => isActive(item.href))) return true;
    if (
      section.subsections?.some((sub) =>
        sub.items.some((item) => isActive(item.href))
      )
    )
      return true;
    return false;
  }, [section.items, section.subsections, pathname]);

  const panelId = `section-${section.key}`;

  return (
    <>
      <WebSidebarNavItem
        onClick={(e) => onToggle(e)}
        icon={section.icon}
        label={section.name}
        active={hasActiveItem}
        collapsed={collapsed}
        ariaExpanded={expanded}
        ariaControls={panelId}
        data-section={dataSection}
        rightSlot={
          !collapsed && (
            <ChevronRightIcon
              className={`tw-h-4 tw-w-4 tw-shrink-0 tw-ml-auto tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
                expanded ? "tw-rotate-90" : ""
              }`}
            />
          )
        }
      />

      {!collapsed && (
        <div
          className={`tw-grid tw-transition-[grid-template-rows] tw-duration-300 tw-ease-out motion-reduce:tw-transition-none ${
            expanded ? "tw-grid-rows-[1fr]" : "tw-grid-rows-[0fr]"
          }`}
        >
          <div className="tw-overflow-hidden">
            <div
              id={panelId}
              aria-label={`${section.name} items`}
              className="tw-relative tw-p-0 tw-m-0"
            >
              <div
                className={`tw-absolute tw-left-7 tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-800 tw-transition-opacity tw-duration-300 motion-reduce:tw-transition-none ${
                  expanded ? "tw-opacity-100" : "tw-opacity-0"
                }`}
                aria-hidden="true"
              />

              <ul className="tw-list-none tw-p-0 tw-m-0">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href} className="tw-m-0 tw-p-0">
                      <Link
                        href={item.href}
                        className={`tw-w-[calc(100%-2.75rem)] tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-justify-start tw-ml-[2.75rem] tw-pl-3 tw-pr-3 tw-h-11 tw-text-base tw-touch-action-manipulation ${
                          active
                            ? "tw-text-white tw-bg-iron-900 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-bg-iron-900 active:tw-text-white"
                            : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {section.subsections?.map((subsection) => {
                const isSubExpanded =
                  expanded &&
                  (expandedSubsection === subsection.name ||
                    activeSubsection === subsection.name);

                return (
                  <WebSidebarExpandableGroup
                    key={subsection.name}
                    name={subsection.name}
                    items={subsection.items}
                    pathname={pathname}
                    expanded={isSubExpanded}
                    onToggle={(isNowExpanded) =>
                      handleSubsectionToggle(subsection.name, isNowExpanded)
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(WebSidebarExpandable);
