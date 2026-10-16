"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useId, useState, type ReactNode } from "react";
import { TDH_FOCUS_RING } from "../shared/tdhStyles";

/**
 * One program of the programs table: its name is the button that opens the
 * row's details, with a leading chevron, as in the formal model's table, so
 * the toggle sits where the eye starts, not under the row's tallest cell.
 */
export default function ProgramRow({
  name,
  role,
  cells,
  details,
  columns,
  showLabel,
}: {
  readonly name: string;
  readonly role: string;
  /** The row's other cells: status, vectors, compute time. */
  readonly cells: ReactNode;
  readonly details: ReactNode;
  /** The grid template shared with the header row. */
  readonly columns: string;
  /** The button's accessible name: "Show the details of Rust core". */
  readonly showLabel: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <li className="tw-px-4 tw-py-4">
      <div className={`tw-space-y-4 lg:tw-space-y-0 ${columns}`}>
        <div className="tw-min-w-0">
          <h3 className="tw-m-0">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              aria-label={showLabel}
              onClick={() => setOpen((value) => !value)}
              className={`-tw-ml-2 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-base tw-font-semibold tw-text-iron-50 hover:tw-bg-iron-800 ${TDH_FOCUS_RING}`}
            >
              <ChevronRightIcon
                aria-hidden="true"
                className={`tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${open ? "tw-rotate-90" : ""}`}
              />
              {name}
            </button>
          </h3>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {role}
          </p>
        </div>
        {cells}
      </div>
      <div id={id} hidden={!open} className="tw-mt-3">
        {details}
      </div>
    </li>
  );
}
