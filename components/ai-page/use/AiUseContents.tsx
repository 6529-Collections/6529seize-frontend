"use client";

import { ArrowUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

type Section = { readonly id: string; readonly title: string };

/** The section whose heading was last scrolled past the top third. */
function useCurrentSection(sections: readonly Section[]): number {
  const [current, setCurrent] = useState(-1);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((heading): heading is HTMLElement => heading !== null);
    const update = () => {
      const line = window.innerHeight / 3;
      let last = -1;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= line) {
          last = index;
        }
      });
      setCurrent(last);
    };
    const observer = new IntersectionObserver(update, {
      rootMargin: "0px 0px -66% 0px",
    });
    headings.forEach((heading) => observer.observe(heading));
    // The observer reports each heading once as it starts, which sets the
    // first section; scrolling keeps it current.
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [sections]);
  return current;
}

const LINK =
  "tw-flex tw-min-h-9 tw-items-baseline tw-gap-2.5 tw-rounded-md tw-px-2 tw-py-1.5 tw-text-sm tw-leading-5 tw-no-underline tw-transition focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

function List({
  sections,
  current,
  onPick,
}: {
  readonly sections: readonly Section[];
  readonly current: number;
  readonly onPick?: (() => void) | undefined;
}) {
  return (
    <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            onClick={onPick}
            aria-current={index === current ? "location" : undefined}
            className={`${LINK} ${
              index === current
                ? "tw-bg-white/[0.06] tw-text-iron-50"
                : "tw-text-iron-400 hover:tw-text-iron-100"
            }`}
          >
            <span
              className={`tw-w-5 tw-flex-none tw-text-right tw-text-xs tw-tabular-nums ${index === current ? "tw-text-primary-300" : "tw-text-iron-600"}`}
            >
              {index + 1}
            </span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * The walk-through's contents. From 1024 px a column beside it that marks
 * the section in view; on a phone a slim bar that stays at the top, says
 * where you are and opens the list, and a button back to the top.
 */
export default function AiUseContents({
  sections,
  label,
  backToTop,
  layout,
}: {
  readonly sections: readonly Section[];
  readonly label: string;
  readonly backToTop: string;
  readonly layout: "column" | "bar";
}) {
  const current = useCurrentSection(sections);
  const [open, setOpen] = useState(false);

  if (layout === "column") {
    return (
      <nav aria-label={label}>
        <p className="tw-mb-2 tw-mt-0 tw-px-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
          {label}
        </p>
        <List sections={sections} current={current} />
      </nav>
    );
  }

  const here = sections[current];
  // Once a section is in view the bar holds to the top of the screen; its
  // place in the page keeps its height, so nothing below it moves.
  const held = current >= 0;
  return (
    <div className="tw-min-h-11 lg:tw-hidden">
      <nav
        aria-label={label}
        className={`tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/95 tw-px-4 tw-backdrop-blur-md ${held ? "tw-fixed tw-inset-x-0 tw-top-0 tw-z-40 tw-shadow-[0_8px_24px_-12px_rgba(0,0,0,0.9)]" : "-tw-mx-4"}`}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <span className="tw-min-w-0 tw-truncate">
            {here ? (
              <>
                <span className="tw-tabular-nums tw-text-iron-500">
                  {current + 1}
                </span>
                <span aria-hidden="true" className="tw-mx-1.5 tw-text-iron-600">
                  ·
                </span>
                {here.title}
              </>
            ) : (
              label
            )}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-5 tw-flex-none tw-text-iron-400 tw-transition ${open ? "tw-rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="tw-max-h-[60vh] tw-overflow-y-auto tw-pb-3">
            <List
              sections={sections}
              current={current}
              onPick={() => setOpen(false)}
            />
          </div>
        )}
      </nav>
      {current >= 0 && (
        <a
          href="#top"
          aria-label={backToTop}
          className="tw-fixed tw-bottom-5 tw-right-4 tw-z-30 tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-iron-900/95 tw-text-iron-100 tw-shadow-lg tw-backdrop-blur focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <ArrowUpIcon aria-hidden="true" className="tw-size-5" />
        </a>
      )}
    </div>
  );
}
