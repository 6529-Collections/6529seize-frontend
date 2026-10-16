"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";
import styles from "./tdhRowsPreview.module.css";

/** The address's fragment, without the `#`. */
function currentHash(): string {
  return window.location.hash.slice(1);
}

function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * A long reference table shown as its first rows, inline, with a button for
 * the rest ("Show all 15 issues"): the table marks the rows after the first
 * ones `data-tdh-more-row`. The hidden rows stay in the document, and an
 * address that names one of the table's rows (`#bug-7`) opens the whole
 * table; a row it names shows even while the table is collapsed.
 */
export default function TdhRowsPreview({
  more,
  less,
  ids,
  children,
}: {
  /** The button's label while collapsed: "Show all 15 issues". */
  readonly more: string;
  readonly less: string;
  /** The anchors of the table's rows, so a link to one opens the table. */
  readonly ids: readonly string[];
  readonly children: ReactNode;
}) {
  const id = useId();
  const hash = useSyncExternalStore(subscribeToHash, currentHash, () => "");
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? ids.includes(hash);
  return (
    <div>
      <div id={id} className={open ? undefined : styles["collapsed"]}>
        {children}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setToggled(!open)}
        className={`tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-medium tw-text-primary-300 hover:tw-text-primary-400 ${TDH_FOCUS_RING}`}
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
