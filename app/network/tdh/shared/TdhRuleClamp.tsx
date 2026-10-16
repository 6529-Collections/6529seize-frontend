"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId, useState, type ReactNode } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

/**
 * A long rule block on a phone: its first lines and a button that shows the
 * rest. From `sm` the whole block always shows and the button is not
 * rendered visibly. The hidden lines stay in the document, so a screen
 * reader and find-in-page still reach them.
 */
export default function TdhRuleClamp({
  more,
  less,
  children,
}: {
  /** The button's label while the block is clamped ("Show all 34 lines"). */
  readonly more: string;
  readonly less: string;
  readonly children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="tw-relative">
      {/* Clamped on phones by design; the button below reveals the rest. */}
      <div
        id={id}
        data-tdh-check-ignore={open ? undefined : "text-clipped"}
        className={
          open ? "" : "max-sm:tw-max-h-[19rem] max-sm:tw-overflow-hidden"
        }
      >
        {children}
      </div>
      {!open && (
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-11 tw-h-16 tw-bg-gradient-to-t tw-from-iron-950 tw-to-transparent sm:tw-hidden"
        />
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={`tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-text-sm tw-font-medium tw-text-primary-300 hover:tw-text-primary-400 sm:tw-hidden ${TDH_FOCUS_RING}`}
      >
        {open ? less : more}
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-4 tw-transition-transform motion-reduce:tw-transition-none ${open ? "tw-rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
