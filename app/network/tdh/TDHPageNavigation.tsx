"use client";

import { ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
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

/**
 * The page's contents, as navigation rather than buttons (used by the
 * consolidation design page): a numbered list of section links in columns
 * from `md`, and a collapsed "On this page" menu on phones.
 */
export function TDHSectionNavigation({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly TDHNavigationItem[];
}) {
  const list = (columns: string) => (
    <ol
      className={`tw-m-0 tw-grid tw-list-none tw-gap-x-6 tw-gap-y-0.5 tw-p-0 ${columns}`}
    >
      {items.map(({ id, label: itemLabel }, index) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className={`tw-flex tw-min-h-11 tw-items-center tw-gap-2.5 tw-rounded-md tw-px-2 tw-text-sm tw-text-iron-200 tw-no-underline hover:tw-bg-iron-800/60 hover:tw-text-iron-50 ${TDH_FOCUS}`}
          >
            <span className="tw-w-4 tw-shrink-0 tw-text-right tw-text-xs tw-tabular-nums tw-text-iron-500">
              {index + 1}
            </span>
            {itemLabel}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <nav
      aria-label={label}
      className="tw-mt-6 tw-max-w-4xl tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/40 tw-px-2 tw-py-2"
    >
      <details className="tw-group md:tw-hidden">
        <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-px-2 tw-text-sm tw-font-medium tw-text-iron-100 [&::-webkit-details-marker]:tw-hidden">
          {label}
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
          />
        </summary>
        {list("tw-grid-cols-1")}
      </details>
      <div className="tw-hidden md:tw-block">
        <p className="tw-m-0 tw-px-2 tw-pb-1 tw-pt-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
          {label}
        </p>
        {list("md:tw-grid-cols-2 lg:tw-grid-cols-4")}
      </div>
    </nav>
  );
}

export function TDHRelatedLinks({
  links,
  variant = "cards",
}: {
  readonly links: readonly TDHRelatedLink[];
  /** `list`: one row per link, for longer lists that cards would orphan. */
  readonly variant?: "cards" | "list";
}) {
  if (variant === "list") {
    return (
      <ul
        className={`${TDH_PANEL} tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0`}
      >
        {links.map(({ href, title, description }) => (
          <li key={href}>
            <Link
              href={href}
              className={`tw-group tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-0.5 tw-px-5 tw-py-3.5 tw-no-underline tw-transition-colors hover:tw-bg-iron-900 motion-reduce:tw-transition-none ${TDH_FOCUS}`}
            >
              <span className="tw-text-[15px] tw-font-medium tw-text-iron-100 group-hover:tw-text-primary-300">
                {title}
              </span>
              <ArrowRightIcon
                aria-hidden="true"
                className="tw-row-span-2 tw-size-4 tw-text-iron-500 tw-transition-transform group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 motion-reduce:tw-transition-none"
              />
              <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
                {description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
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
