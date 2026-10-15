"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

/** Pixels below the top of the viewport at which a section counts as current. */
const ACTIVE_OFFSET = 128;

export interface ScrollSpyItem {
  readonly id: string;
  readonly label: string;
  readonly prefix?: string;
  readonly depth?: 0 | 1;
}

/**
 * A table of contents that highlights the section in view: a sticky rail from
 * `lg`, a disclosure on smaller screens. Headings named in the URL hash get
 * focus, so keyboard and screen-reader users land where a link points.
 */
export default function TdhScrollSpyNav({
  items,
  label,
}: {
  readonly items: readonly ScrollSpyItem[];
  readonly label: string;
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    // The current section is the last one whose top has passed the sticky
    // header; above the first section, the first one. Computed from layout
    // on scroll, so it is right at the top of the page and after a jump.
    const update = () => {
      let current = items[0]?.id ?? null;
      for (const item of items) {
        const element = globalThis.document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top <= ACTIVE_OFFSET) {
          current = item.id;
        }
      }
      setActive(current);
    };
    let frame = 0;
    const schedule = () => {
      globalThis.cancelAnimationFrame(frame);
      frame = globalThis.requestAnimationFrame(update);
    };
    update();
    globalThis.addEventListener("scroll", schedule, { passive: true });
    globalThis.addEventListener("resize", schedule);
    return () => {
      globalThis.cancelAnimationFrame(frame);
      globalThis.removeEventListener("scroll", schedule);
      globalThis.removeEventListener("resize", schedule);
    };
  }, [items]);

  useEffect(() => {
    const focusHash = () => {
      const id = globalThis.location.hash.slice(1);
      const target = id
        ? globalThis.document.getElementById(`${id}-heading`)
        : null;
      if (target) {
        globalThis.requestAnimationFrame(() =>
          target.focus({ preventScroll: true })
        );
      }
    };
    focusHash();
    globalThis.addEventListener("hashchange", focusHash);
    return () => globalThis.removeEventListener("hashchange", focusHash);
  }, []);

  const list = (
    <ol className="tw-m-0 tw-list-none tw-space-y-0.5 tw-p-0">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              className={`tw-flex tw-min-h-9 tw-items-baseline tw-gap-2 tw-rounded-md tw-py-1.5 tw-pr-2 tw-text-sm tw-leading-5 tw-no-underline tw-transition-colors motion-reduce:tw-transition-none ${
                item.depth === 1 ? "tw-pl-6" : "tw-pl-2"
              } ${
                isActive
                  ? "tw-bg-iron-900 tw-text-iron-50 tw-shadow-[inset_2px_0_0_0] tw-shadow-primary-400"
                  : "tw-text-iron-400 hover:tw-bg-iron-900 hover:tw-text-iron-100"
              } ${TDH_FOCUS_RING}`}
            >
              {item.prefix && (
                <span className="tw-w-5 tw-shrink-0 tw-text-xs tw-tabular-nums tw-text-iron-500">
                  {item.prefix}
                </span>
              )}
              <span>{item.label}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <details className="tw-group tw-mb-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 lg:tw-hidden">
        <summary
          className={`tw-flex tw-min-h-12 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-px-4 tw-text-sm tw-font-medium tw-text-iron-100 [&::-webkit-details-marker]:tw-hidden ${TDH_FOCUS_RING}`}
        >
          {label}
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-size-4 tw-text-iron-400 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
          />
        </summary>
        <nav aria-label={label} className="tw-px-2 tw-pb-3">
          {list}
        </nav>
      </details>
      <nav
        aria-label={label}
        className="tw-sticky tw-top-24 tw-hidden tw-max-h-[calc(100vh-7rem)] tw-overflow-y-auto tw-pr-2 lg:tw-block"
      >
        <p className="tw-m-0 tw-mb-2 tw-px-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
          {label}
        </p>
        {list}
      </nav>
    </>
  );
}
