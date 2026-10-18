"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { TrackBar } from "../marks/Track";
import { EX_ELEVATION, EX_FOCUS } from "../tokens";
import { CHAPTERS, HUB_HREF } from "./chapters";

/**
 * The chapter switcher (EXPLAINED.md §6.2): "6529 Explained" opens the hub
 * and every chapter, the live ones as links with their number, the others
 * as coming, with no link and no number until they ship.
 */
export default function ChapterSwitcher({
  locale,
  current,
  defaultOpen = false,
}: {
  readonly locale: SupportedLocale;
  /** The chapter on screen, or "hub". */
  readonly current: string;
  /** Rendered open, for the gallery and the gates' states. */
  readonly defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const rowClass = `tw-flex tw-min-h-10 tw-items-center tw-gap-3 tw-rounded-lg tw-px-2.5 tw-text-[15px] tw-leading-5 tw-no-underline ${EX_FOCUS}`;
  return (
    <div ref={root} className="tw-relative" data-switcher="">
      <button
        type="button"
        className={`tw-inline-flex tw-h-9 tw-cursor-pointer tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-transparent tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-50 hover:tw-border-iron-700 ${EX_FOCUS}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={kt(locale, "explained.kit.shell.switcherLabel")}
        onClick={() => setOpen((value) => !value)}
      >
        {kt(locale, "explained.kit.shell.explained")}
        <Icon
          kind="chevron"
          className={`tw-size-3.5 tw-text-iron-400 ${open ? "tw-rotate-180" : ""}`}
        />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className={`tw-absolute tw-right-0 tw-top-11 tw-z-30 tw-w-[300px] tw-max-w-[calc(100vw-40px)] tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-2 ${EX_ELEVATION.menu}`}
      >
        <ul className="tw-m-0 tw-list-none tw-p-0">
          <li>
            <Link
              href={HUB_HREF}
              className={`${rowClass} ${current === "hub" ? "tw-bg-iron-900 tw-text-iron-50" : "tw-text-iron-300 hover:tw-bg-iron-900"}`}
              {...(current === "hub"
                ? { "aria-current": "page" as const }
                : {})}
            >
              <span className="tw-font-semibold">
                {kt(locale, "explained.kit.shell.hub")}
              </span>
            </Link>
          </li>
          {CHAPTERS.map((chapter) => {
            const title = kt(locale, chapter.title);
            if (chapter.status === "live" && chapter.href) {
              const on = current === chapter.id;
              return (
                <li key={chapter.id}>
                  <Link
                    href={chapter.href}
                    className={`${rowClass} ${on ? "tw-bg-iron-900 tw-text-iron-50" : "tw-text-iron-300 hover:tw-bg-iron-900"}`}
                    {...(on ? { "aria-current": "page" as const } : {})}
                  >
                    <span className="tw-w-6 tw-text-xs tw-font-semibold tw-text-primary-300">
                      {chapter.number}
                    </span>
                    <span className="tw-flex-1">{title}</span>
                    <TrackBar maturity={chapter.maturity} />
                  </Link>
                </li>
              );
            }
            return (
              <li
                key={chapter.id}
                className={`${rowClass} tw-cursor-default tw-text-iron-400`}
              >
                <span className="tw-w-6" aria-hidden="true" />
                <span className="tw-flex-1">{title}</span>
                <span className="tw-text-xs tw-font-medium">
                  {kt(locale, "explained.kit.shell.coming")}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
