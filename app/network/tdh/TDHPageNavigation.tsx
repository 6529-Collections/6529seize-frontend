"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { TDH_CARD_GRID, TDH_FOCUS, TDH_PANEL } from "./TDHSection";

interface TDHRelatedLink {
  readonly href: string;
  readonly title: string;
  readonly description: string;
}

export function TDHRelatedLinks({
  links,
  variant = "cards",
}: {
  readonly links: readonly TDHRelatedLink[];
  /**
   * `list`: one row per link, for longer lists that cards would orphan;
   * `grid`: the overview's card size, two columns from `sm` and, for three
   * links or more, three from `xl`, the same as "Go deeper" above it.
   */
  readonly variant?: "cards" | "list" | "grid";
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
              <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
                {description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  // Two links fill two columns; a third column only for three or more.
  const gridColumns =
    links.length >= 3
      ? "sm:tw-grid-cols-2 xl:tw-grid-cols-3"
      : "sm:tw-grid-cols-2";
  return (
    <div
      className={
        variant === "grid" ? `tw-grid tw-gap-4 ${gridColumns}` : TDH_CARD_GRID
      }
    >
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
          <span className="tw-col-span-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {description}
          </span>
        </Link>
      ))}
    </div>
  );
}
