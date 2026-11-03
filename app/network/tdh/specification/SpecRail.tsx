"use client";

import { useEffect, useRef, useState } from "react";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";

/**
 * The specification's sections as a rail in the margin column, from a wide
 * desktop up (EXPLAINED.md §6.2, the reference pages): it stays in view
 * beside the text and marks the section being read, as the top bar does
 * on narrower screens. Where a table runs under it, it steps aside, so it
 * never covers a row; the code blocks keep to the text's measure.
 */
export interface RailEntry {
  /** "#s5" */
  readonly href: string;
  /** "5" */
  readonly no: string;
  readonly title: string;
}

/** Where a section counts as being read: a third of the way down the screen. */
const READING_SHARE = 0.35;

/** Blocks wide enough to run under the rail. */
const WIDE = "table, [data-code-wrap], [data-spec-wide]";

export default function SpecRail({
  items,
  label,
  sections,
}: {
  readonly items: readonly RailEntry[];
  /** "Sections", the rail's name for screen readers and its heading. */
  readonly label: string;
  /** The id of the element that holds the sections. */
  readonly sections: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [clear, setClear] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((target): target is HTMLElement => target !== null);
    const holder = document.getElementById(sections);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * READING_SHARE;
      let current: string | null = null;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) {
          current = `#${target.id}`;
        }
      }
      setActive(current);
      const nav = navRef.current;
      if (nav === null || holder === null) return;
      const rail = nav.getBoundingClientRect();
      const under = [...holder.querySelectorAll<HTMLElement>(WIDE)].some(
        (block) => {
          const box = block.getBoundingClientRect();
          return (
            box.width > 0 &&
            box.right > rail.left &&
            box.top < rail.bottom &&
            box.bottom > rail.top
          );
        }
      );
      setClear(!under);
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
  }, [items, sections]);
  return (
    <div
      className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-right-0 tw-top-[84px] tw-hidden tw-w-[208px] min-[1400px]:tw-block"
      data-spec-rail=""
      data-ex-nocopy=""
    >
      <nav
        ref={navRef}
        aria-label={label}
        className={`tw-pointer-events-auto tw-sticky tw-top-[88px] tw-pt-2.5 tw-transition-opacity tw-duration-150 motion-reduce:tw-transition-none ${clear ? "tw-opacity-100" : "tw-invisible tw-opacity-0"}`}
      >
        <span className={`${EX_TEXT.label} tw-mb-2 tw-block`}>{label}</span>
        <ol className="tw-m-0 tw-list-none tw-border-0 tw-border-l tw-border-solid tw-border-iron-800 tw-p-0">
          {items.map((item) => {
            const on = item.href === active;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={on ? "location" : undefined}
                  className={`-tw-ml-px tw-flex tw-items-baseline tw-gap-2 tw-border-0 tw-border-l-2 tw-border-solid tw-py-[3px] tw-pl-3 tw-text-[13px] tw-font-medium tw-leading-5 tw-no-underline ${on ? "tw-border-primary-400 tw-text-iron-50" : "tw-border-transparent tw-text-iron-400 hover:tw-text-iron-50"} ${EX_FOCUS}`}
                >
                  <span className="tw-w-5 tw-flex-none tw-text-xs tw-font-semibold tw-tabular-nums tw-text-iron-500">
                    {item.no}
                  </span>
                  <span>{item.title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
