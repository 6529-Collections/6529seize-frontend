"use client";

import Link from "next/link";
import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { SidebarSection } from "@/components/navigation/navTypes";

interface DesktopSidebarSectionProps {
  readonly section: SidebarSection;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly collapsed: boolean;
  readonly pathname: string | null;
}

const baseRowClasses =
  "tw-w-full tw-text-lg tw-no-underline tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-group tw-justify-start tw-px-3 tw-h-12 tw-transition-all tw-duration-300";

const navStateClasses = (active?: boolean) =>
  active
    ? "tw-text-white desktop-hover:hover:tw-text-white"
    : "tw-text-iron-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white";

const itemClasses = (active?: boolean) =>
  `tw-group tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-transition-all tw-duration-300 tw-px-3 tw-py-2.5 ${
    active ? "tw-bg-iron-800 tw-text-white" : "tw-text-[#E5E5E5] hover:tw-bg-[#1A1A1A] hover:tw-text-white"
  }`;

export default function DesktopSidebarExpandableItem({
  section,
  expanded,
  onToggle,
  collapsed,
  pathname,
}: DesktopSidebarSectionProps) {
  // Determine active state similar to primary items
  const sectionActive =
    expanded ||
    (pathname?.startsWith(section.items[0]?.href || "") ?? false) ||
    (section.key === "tools" && (pathname?.startsWith("/tools") ?? false)) ||
    (section.key === "about" && (pathname?.startsWith("/about") ?? false));

  // Collapsed: render as a single icon-only row linking to the first item
  if (collapsed) {
    const href = section.items[0]?.href || "#";
    return (
      <li>
        <Link
          href={href}
          className={`${baseRowClasses} ${navStateClasses(sectionActive)}`}
          title={section.name}
        >
          <section.icon aria-hidden="true" className="tw-h-6 tw-w-6 tw-shrink-0" />
        </Link>
      </li>
    );
  }

  // Expanded: render a header with chevron and nested items when open
  return (
    <div className="tw-hidden lg:tw-block">
      <button
        type="button"
        onClick={onToggle}
        className={`${baseRowClasses} ${navStateClasses(sectionActive)} tw-bg-transparent tw-border-0 tw-justify-between`}
        aria-expanded={expanded}
        aria-controls={`${section.key}-section`}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${section.name} section`}
      >
        <div className="tw-flex tw-gap-4 tw-items-center tw-justify-start">
          <section.icon aria-hidden="true" className="tw-h-6 tw-w-6 tw-shrink-0" />
          <span className="tw-hidden lg:tw-block">{section.name}</span>
        </div>
        <ChevronRightIcon
          className={`tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform tw-duration-300 tw-hidden lg:tw-block ${
            expanded ? "tw-rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <ul role="list" className="tw-mt-1 tw-space-y-1" id={`${section.key}-section`}>
          {section.items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.name} className="tw-ml-6">
                <Link href={item.href} className={itemClasses(active)}>
                  {item.name}
                </Link>
              </li>
            );
          })}

          {section.subsections?.map((sub) => (
            <li key={sub.name} className="tw-ml-6">
              <div className="tw-text-xs tw-font-semibold tw-text-[#E5E5E5] tw-px-2 tw-py-1 tw-mt-4">
                {sub.name}
              </div>
              <ul role="list" className="tw-space-y-1">
                {sub.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link href={item.href} className={itemClasses(active)}>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
