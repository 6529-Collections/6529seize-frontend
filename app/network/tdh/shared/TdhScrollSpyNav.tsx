"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

/** A section becomes current once its top passes 30% of the viewport. */
const activeOffset = () => Math.max(120, globalThis.innerHeight * 0.3);

interface ScrollSpyItem {
  readonly id: string;
  readonly label: string;
  readonly prefix?: string;
  readonly depth?: 0 | 1;
}

/**
 * A table of contents that highlights the section in view: a sticky rail from
 * `lg`; on smaller screens a disclosure at the top, and, once that has
 * scrolled away, a compact bar at the bottom of the screen naming the
 * section in view, which opens the contents. Headings named in the URL hash
 * get focus, so keyboard and screen-reader users land where a link points.
 */
export default function TdhScrollSpyNav({
  items,
  label,
}: {
  readonly items: readonly ScrollSpyItem[];
  readonly label: string;
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  // Below lg, once the reader has scrolled past the contents at the top, a
  // compact bar at the bottom of the screen names the section in view and
  // opens the contents again, so a long page never loses its place.
  const [floating, setFloating] = useState(false);
  const topRef = useRef<HTMLDetailsElement>(null);
  const floatingRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // The current section is the last one whose top has passed the sticky
    // header; above the first section, the first one. Computed from layout
    // on scroll, so it is right at the top of the page and after a jump.
    const update = () => {
      let current = items[0]?.id ?? null;
      const offset = activeOffset();
      for (const item of items) {
        const element = globalThis.document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top <= offset) {
          current = item.id;
        }
      }
      setActive(current);
      const top = topRef.current;
      setFloating(top !== null && top.getBoundingClientRect().bottom < 0);
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

  const activeItem = items.find((item) => item.id === active) ?? items[0];
  const closeFloating = () => {
    if (floatingRef.current) {
      floatingRef.current.open = false;
    }
  };
  const list = (
    <ol className="tw-m-0 tw-list-none tw-space-y-0.5 tw-p-0">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={closeFloating}
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
      <details
        ref={topRef}
        className="tw-group tw-mb-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 lg:tw-hidden"
      >
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
      {floating && activeItem && (
        <details
          ref={floatingRef}
          // Solid, with a shadow that fades the text behind it, 8 px off
          // the bottom edge: no line of the page shows through.
          className="tw-group tw-fixed tw-inset-x-3 tw-bottom-2 tw-z-30 tw-flex tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-[0_-12px_24px_8px_rgba(10,10,12,0.85)] lg:tw-hidden"
          data-tdh-floating-contents=""
        >
          <summary
            className={`tw-flex tw-min-h-12 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-px-4 tw-text-sm tw-text-iron-100 [&::-webkit-details-marker]:tw-hidden ${TDH_FOCUS_RING}`}
          >
            <span className="tw-shrink-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              {label}
            </span>
            <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-medium">
              {activeItem.prefix && (
                <span className="tw-mr-1.5 tw-tabular-nums tw-text-iron-400">
                  {activeItem.prefix}
                </span>
              )}
              {activeItem.label}
            </span>
            <ChevronUpIcon
              aria-hidden="true"
              className="tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
            />
          </summary>
          <nav
            aria-label={label}
            className="tw-max-h-[60vh] tw-overflow-y-auto tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-px-2 tw-py-2"
          >
            {list}
          </nav>
        </details>
      )}
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
