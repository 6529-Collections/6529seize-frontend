"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TDH_FOCUS, TDH_PANEL } from "./TDHSection";

interface TDHNavigationItem {
  readonly id: string;
  readonly label: string;
}

interface TDHRelatedLink {
  readonly href: string;
  readonly title: string;
  readonly description: string;
}

// Scrolls to and focuses the section heading named in the URL hash, on load
// and whenever the hash changes.
export function useTDHSectionHashFocus(sectionIds: readonly string[]) {
  useEffect(() => {
    const focusAnchor = () => {
      const id = globalThis.location.hash.slice(1);
      if (!sectionIds.includes(id)) return;
      globalThis.requestAnimationFrame(() => {
        globalThis.document
          .getElementById(id)
          ?.scrollIntoView({ block: "start" });
        globalThis.document
          .getElementById(`${id}-heading`)
          ?.focus({ preventScroll: true });
      });
    };
    focusAnchor();
    globalThis.addEventListener("hashchange", focusAnchor);
    return () => globalThis.removeEventListener("hashchange", focusAnchor);
  }, [sectionIds]);
}

export function TDHSectionNavigation({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly TDHNavigationItem[];
}) {
  return (
    <nav aria-label={label} className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2">
      {items.map(({ id, label: itemLabel }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-bg-iron-800 hover:tw-text-iron-50 ${TDH_FOCUS}`}
        >
          {itemLabel}
        </a>
      ))}
    </nav>
  );
}

export function TDHRelatedLinks({
  links,
}: {
  readonly links: readonly TDHRelatedLink[];
}) {
  return (
    <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
      {links.map(({ href, title, description }) => (
        <Link
          key={href}
          href={href}
          className={`${TDH_PANEL} tw-block tw-p-5 tw-no-underline hover:tw-border-iron-600 ${TDH_FOCUS}`}
        >
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-100">
            {title}
          </span>
          <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
            {description}
          </span>
        </Link>
      ))}
    </div>
  );
}
