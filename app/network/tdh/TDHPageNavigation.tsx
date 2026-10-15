"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect } from "react";
import { TDH_CARD_GRID, TDH_FOCUS, TDH_PANEL } from "./TDHSection";

interface TDHRelatedLink {
  readonly href: string;
  readonly title: string;
  readonly description: string;
}

const EMPTY_MOVED: Readonly<Record<string, string>> = {};

/**
 * Scrolls to and focuses the section heading named in the URL hash, on load
 * and whenever the hash changes. A hash in `moved` names a section that now
 * lives elsewhere: the page replaces the address with its new place, so old
 * links keep working.
 */
export function useTDHSectionHashFocus(
  sectionIds: readonly string[],
  moved: Readonly<Record<string, string>> = EMPTY_MOVED
) {
  useEffect(() => {
    const focusAnchor = () => {
      const id = globalThis.location.hash.slice(1);
      const target = moved[id];
      if (target !== undefined) {
        if (target.startsWith("#")) {
          globalThis.history.replaceState(null, "", target);
          globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
        } else {
          globalThis.location.replace(target);
        }
        return;
      }
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
  }, [sectionIds, moved]);
}

interface TDHNavigationItem {
  readonly id: string;
  readonly label: string;
}

/** Jump links to a page's sections (used by the consolidation design page). */
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
    <div className={TDH_CARD_GRID}>
      {links.map(({ href, title, description }) => (
        <Link
          key={href}
          href={href}
          className={`${TDH_PANEL} tw-group tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-content-start tw-gap-x-3 tw-gap-y-2 tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-iron-600 motion-reduce:tw-transition-none ${TDH_FOCUS}`}
        >
          <span className="tw-text-base tw-font-medium tw-text-iron-100">
            {title}
          </span>
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-mt-1 tw-size-4 tw-text-iron-500 tw-transition-transform group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 motion-reduce:tw-transition-none"
          />
          <span className="tw-col-span-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {description}
          </span>
        </Link>
      ))}
    </div>
  );
}
