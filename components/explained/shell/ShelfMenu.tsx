"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { EX_ELEVATION, EX_FOCUS } from "../tokens";
import type { PageLink } from "./chapters";

/**
 * The shelf (EXPLAINED.md §6.2): the chapter's reference pages behind one
 * menu, numbered S1 to S5. A native disclosure, closed by Escape and by a
 * click outside it.
 */
export default function ShelfMenu({
  shelf,
  active,
  locale,
  defaultOpen = false,
}: {
  readonly shelf: readonly PageLink[];
  readonly active: string;
  readonly locale: SupportedLocale;
  readonly defaultOpen?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const details = ref.current;
    if (!details) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) {
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  const on = shelf.find((page) => page.id === active);
  return (
    <details
      ref={ref}
      className="tw-relative tw-flex-none"
      open={defaultOpen}
      data-shelf=""
      // Open, the menu floats over the page by design: the layout gate does
      // not count it as a card beside the page's cards or text.
      data-tdh-check-ignore="card-gap text-collision"
    >
      <summary
        className={`tw-relative tw-flex tw-h-14 tw-cursor-pointer tw-list-none tw-items-center tw-gap-[7px] tw-whitespace-nowrap tw-px-[11px] tw-text-[15px] [&::-webkit-details-marker]:tw-hidden ${on ? "tw-font-semibold tw-text-iron-50" : "tw-font-medium tw-text-iron-400 hover:tw-text-iron-50"} ${EX_FOCUS}`}
      >
        {/* On a shelf page the whole name shows only on a wide screen; below
            it the bar keeps every spine page whole and the shelf says "Shelf",
            underlined, since the breadcrumb and the H1 name the page. */}
        {on ? (
          <>
            <span className="tw-hidden 2xl:tw-inline">
              {kt(locale, "explained.kit.shell.shelfOn", {
                page: kt(locale, on.title),
              })}
            </span>
            <span
              className="2xl:tw-hidden"
              title={kt(locale, "explained.kit.shell.shelfOn", {
                page: kt(locale, on.title),
              })}
            >
              {kt(locale, "explained.kit.shell.shelf")}
            </span>
          </>
        ) : (
          kt(locale, "explained.kit.shell.shelf")
        )}
        <Icon kind="chevron" className="tw-size-3.5" />
        {on && (
          <span
            className="tw-absolute tw-inset-x-[11px] -tw-bottom-px tw-h-0.5 tw-rounded-sm tw-bg-primary-400"
            aria-hidden="true"
          />
        )}
      </summary>
      <ul
        className={`tw-absolute tw-right-0 tw-top-14 tw-z-20 tw-m-0 tw-w-[300px] tw-list-none tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-2 ${EX_ELEVATION.menu}`}
      >
        {shelf.map((page, index) => {
          const current = page.id === active;
          return (
            <li key={page.id}>
              <Link
                href={page.href}
                className={`tw-flex tw-min-h-10 tw-items-center tw-gap-2.5 tw-rounded-lg tw-px-2.5 tw-text-[15px] tw-no-underline ${current ? "tw-bg-iron-900 tw-text-iron-50" : "tw-text-iron-300 hover:tw-bg-iron-900"} ${EX_FOCUS}`}
                {...(current ? { "aria-current": "page" as const } : {})}
              >
                <span className="tw-text-xs tw-font-semibold tw-text-iron-400">{`S${index + 1}`}</span>
                {kt(locale, page.title)}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
