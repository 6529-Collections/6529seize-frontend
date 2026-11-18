"use client";

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useId, useState, type ReactNode } from "react";

/**
 * A card's versions and scores: folded behind a button on a phone, open
 * from 640 px, where the button goes away.
 */
export default function AiModelFold({
  show,
  hide,
  className,
  children,
}: {
  readonly show: string;
  readonly hide: string;
  /** Classes for the folded part, which shows from 640 px. */
  readonly className: string;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-justify-self-start tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-primary-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-hidden"
      >
        {open ? hide : show}
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-4 tw-transition-transform ${open ? "tw-rotate-180" : ""}`}
        />
      </button>
      <div id={id} className={`${className} ${open ? "" : "max-sm:tw-hidden"}`}>
        {children}
      </div>
    </>
  );
}
