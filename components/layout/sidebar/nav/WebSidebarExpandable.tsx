"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import WebSidebarNavItem from "./WebSidebarNavItem";
import WebSidebarExpandableGroup from "./WebSidebarExpandableGroup";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSidebarNavItemActive } from "./sidebarActive";

interface WebSidebarExpandableProps {
  readonly section: SidebarSection;
  readonly expanded: boolean;
  readonly onToggle: (e?: React.MouseEvent) => void;
  readonly onPointerEnter?:
    | React.PointerEventHandler<HTMLButtonElement>
    | undefined;
  readonly onPointerLeave?:
    | React.PointerEventHandler<HTMLButtonElement>
    | undefined;
  readonly onKeyDown?:
    | React.KeyboardEventHandler<HTMLButtonElement>
    | undefined;
  readonly collapsed: boolean;
  readonly pathname: string | null;
  readonly "data-section"?: string | undefined;
}

function WebSidebarExpandable({
  section,
  expanded,
  onToggle,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  collapsed,
  pathname,
  "data-section": dataSection,
}: WebSidebarExpandableProps) {
  const activeSubsection =
    section.subsections?.find((sub) =>
      sub.items.some((item) => isSidebarNavItemActive(item, pathname))
    )?.name ?? null;

  const [subsectionSelection, setSubsectionSelection] = useState<{
    readonly pathname: string | null;
    readonly activeSubsection: string | null;
    readonly selectedSubsection: string | null;
  }>(() => ({
    pathname,
    activeSubsection,
    selectedSubsection: activeSubsection,
  }));

  const expandedSubsection =
    subsectionSelection.pathname === pathname &&
    subsectionSelection.activeSubsection === activeSubsection
      ? subsectionSelection.selectedSubsection
      : activeSubsection;

  const handleSubsectionToggle = useCallback(
    (subsectionName: string, isNowExpanded: boolean) => {
      setSubsectionSelection({
        pathname,
        activeSubsection,
        selectedSubsection: isNowExpanded ? subsectionName : null,
      });
    },
    [activeSubsection, pathname]
  );

  const hasActiveItem = useMemo(() => {
    if (section.items.some((item) => isSidebarNavItemActive(item, pathname))) {
      return true;
    }
    if (
      section.subsections?.some((sub) =>
        sub.items.some((item) => isSidebarNavItemActive(item, pathname))
      )
    )
      return true;
    return false;
  }, [section.items, section.subsections, pathname]);

  const panelId = `section-${section.key}`;
  const flyoutId = `sidebar-flyout-${section.key}`;

  return (
    <>
      <WebSidebarNavItem
        onClick={(e) => onToggle(e)}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        icon={section.icon}
        label={section.name}
        active={hasActiveItem}
        collapsed={collapsed}
        ariaExpanded={expanded}
        ariaControls={collapsed ? flyoutId : panelId}
        data-section={dataSection}
        rightSlot={
          !collapsed && (
            <ChevronRightIcon
              className={`tw-ml-auto tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
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
              role="group"
              aria-label={t(DEFAULT_LOCALE, "navigation.sidebar.panelLabel", {
                section: section.name,
              })}
              className="tw-relative tw-m-0 tw-p-0"
            >
              <div
                className={`tw-absolute tw-bottom-0 tw-left-7 tw-top-0 tw-w-px tw-bg-iron-800 tw-transition-opacity tw-duration-300 motion-reduce:tw-transition-none ${
                  expanded ? "tw-opacity-100" : "tw-opacity-0"
                }`}
                aria-hidden="true"
              />

              <ul className="tw-m-0 tw-list-none tw-p-0">
                {section.items.map((item) => {
                  const active = isSidebarNavItemActive(item, pathname);
                  return (
                    <li key={item.href} className="tw-m-0 tw-p-0">
                      <Link
                        href={item.href}
                        className={`tw-touch-action-manipulation tw-ml-[2.75rem] tw-flex tw-h-11 tw-w-[calc(100%-2.75rem)] tw-cursor-pointer tw-items-center tw-justify-start tw-rounded-xl tw-border-none tw-pl-3 tw-pr-3 tw-text-base tw-font-medium tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 motion-reduce:tw-transition-none ${
                          active
                            ? "tw-bg-iron-900 tw-text-white active:tw-text-white desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white"
                            : "tw-bg-transparent tw-text-iron-400 active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
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
