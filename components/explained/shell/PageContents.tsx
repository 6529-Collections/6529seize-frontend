"use client";

import { useEffect, useRef, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";

/**
 * On this page (EXPLAINED.md §6.2, for the long reference and evidence
 * pages): once the reader has scrolled past the page's head, a slim bar
 * sticks to the top with the page's numbered sections, the one being read
 * marked. On a phone it is one line, "On this page: the section", that
 * opens the list. It takes no room in the page: it floats over it while it
 * shows, and is gone at the top.
 */
export interface ContentsEntry {
  /** "#statement" */
  readonly href: string;
  /** "01" */
  readonly no: string;
  readonly title: string;
}

/** Where a section counts as being read: a third of the way down the screen. */
const READING_SHARE = 0.35;

export default function PageContents({
  items,
  locale,
}: {
  readonly items: readonly ContentsEntry[];
  readonly locale: SupportedLocale;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLOListElement>(null);
  // The wide bar scrolls sideways when its sections outrun it: keep the one
  // being read in view, with room for its neighbour.
  useEffect(() => {
    const row = rowRef.current;
    if (row === null || active === null) return;
    const link = row.querySelector<HTMLElement>('[aria-current="location"]');
    if (link === null) return;
    const left = link.offsetLeft - row.offsetLeft;
    const right = left + link.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, left - 48) });
    }
  }, [active]);
  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((target): target is HTMLElement => target !== null);
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current: string | null = null;
      const line = window.innerHeight * READING_SHARE;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) {
          current = `#${target.id}`;
        }
      }
      setActive(current);
      setShown(current !== null);
      if (current === null) setOpen(false);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [items]);
  const current = items.find((item) => item.href === active) ?? null;
  const label = kt(locale, "explained.kit.contents.label");
  const link = (item: ContentsEntry, wide: boolean) => {
    const on = item.href === active;
    return (
      <a
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={on ? "location" : undefined}
        className={`tw-flex tw-items-baseline tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-no-underline ${wide ? "tw-border-0 tw-border-b-2 tw-border-solid tw-py-3" : "tw-rounded-md tw-px-3 tw-py-2.5"} ${on ? "tw-border-primary-400 tw-text-iron-50" : "tw-border-transparent tw-text-iron-400 hover:tw-text-iron-50"} ${EX_FOCUS}`}
      >
        <span className="tw-text-xs tw-font-semibold tw-tabular-nums tw-text-iron-400">
          {item.no}
        </span>
        <span className={wide ? "" : "tw-whitespace-normal"}>{item.title}</span>
      </a>
    );
  };
  return (
    // On a wide screen the bar sticks inside the page's column; on a phone
    // the app scrolls the window from inside its own frame, where sticky
    // does not hold, so the bar is fixed to the top of the screen.
    <div
      className="tw-z-30 tw-h-0 lg:tw-sticky lg:tw-top-0"
      data-page-contents=""
      data-ex-nocopy=""
    >
      <nav
        aria-label={label}
        className={`tw-z-30 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F]/95 tw-px-5 tw-backdrop-blur tw-transition-opacity tw-duration-150 motion-reduce:tw-transition-none max-lg:tw-fixed max-lg:tw-inset-x-0 max-lg:tw-top-0 md:tw-px-12 lg:tw-absolute lg:tw-inset-x-[-48px] lg:tw-top-0 ${shown ? "tw-opacity-100" : "tw-pointer-events-none tw-opacity-0"}`}
        {...(shown ? {} : { "aria-hidden": true, inert: true })}
      >
        <ol
          ref={rowRef}
          className="tw-m-0 tw-hidden tw-list-none tw-gap-5 tw-overflow-x-auto tw-p-0 [mask-image:linear-gradient(90deg,#000_calc(100%_-_32px),transparent)] [scrollbar-width:none] lg:tw-flex"
        >
          {items.map((item) => (
            <li key={item.href} className="tw-flex-none">
              {link(item, true)}
            </li>
          ))}
        </ol>
        <div className="lg:tw-hidden">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={`tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-50 ${EX_FOCUS}`}
          >
            <span className="tw-min-w-0 tw-truncate">
              <span className="tw-mr-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
                {label}
              </span>
              {current ? `${current.no} ${current.title}` : ""}
            </span>
            <span aria-hidden="true" className="tw-text-iron-400">
              {open ? "–" : "+"}
            </span>
          </button>
          {open && (
            <ol className="tw-m-0 tw-list-none tw-pb-3 tw-pl-0">
              {items.map((item) => (
                <li key={item.href}>{link(item, false)}</li>
              ))}
            </ol>
          )}
        </div>
      </nav>
    </div>
  );
}
