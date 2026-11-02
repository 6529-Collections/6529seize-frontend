"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EX_FOCUS } from "../tokens";

/**
 * A ledger folded on a phone (SCORECARD.md §6.2): from a tablet up every
 * row shows; on a phone only the rows before the fold do, and one control
 * under them opens the rest. A row or block to fold carries
 * `PHONE_MORE_HIDDEN`; nothing else on the page moves, and the server
 * renders it closed, so a phone never sees the long form flash first. A
 * link to a row inside it (#dev-2) opens it, so no anchor lands on a
 * hidden row.
 */
export const PHONE_MORE_HIDDEN = "max-md:group-[:not(.is-open)]/more:tw-hidden";

export default function PhoneMore({
  more,
  less,
  children,
  className = "",
}: {
  /** The control while folded: "All 9 claims". */
  readonly more: ReactNode;
  /** The control while open: "Fewer claims". */
  readonly less: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id === "") return;
      const target = document.getElementById(id);
      if (target && ref.current?.contains(target)) {
        setOpen(true);
        requestAnimationFrame(() => target.scrollIntoView());
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  return (
    <div
      ref={ref}
      className={`tw-group/more ${open ? "is-open" : ""} ${className}`.trim()}
      data-phone-more={open ? "open" : "closed"}
    >
      {children}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`tw-mt-3 tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-primary-300 md:tw-hidden ${EX_FOCUS}`}
      >
        <span
          className={`tw-inline-block tw-transition-transform motion-reduce:tw-transition-none ${open ? "tw-rotate-90" : ""}`}
          aria-hidden="true"
        >
          ›
        </span>
        {open ? less : more}
      </button>
    </div>
  );
}
