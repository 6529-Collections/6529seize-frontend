"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  VOTE_NUMERIC_INPUT_BASE_CLASS,
  VOTE_NUMERIC_INPUT_CLASSES,
  VOTE_NUMERIC_UNIT_CLASS,
  type VoteControlVariant,
} from "./VoteControl.styles";

type VoteNumericInputProps = Omit<
  ComponentProps<"input">,
  "size" | "className" | "children"
> & {
  readonly unit: string;
  readonly variant: VoteControlVariant;
  // The adapter supplies only the controls its voting surface already offers.
  readonly stepControls?:
    | {
        readonly decrease: ReactNode;
        readonly increase: ReactNode;
      }
    | undefined;
  readonly shortcuts?: ReactNode;
};

export function VoteNumericInput({
  unit,
  variant,
  stepControls,
  shortcuts,
  ...inputProps
}: VoteNumericInputProps) {
  return (
    <div>
      <div
        className={
          stepControls
            ? "tw-flex tw-min-w-0 tw-items-stretch tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800"
            : undefined
        }
      >
        {stepControls?.decrease}
        <div className="tw-relative tw-min-w-0 tw-flex-1">
          <input
            {...inputProps}
            className={`${VOTE_NUMERIC_INPUT_BASE_CLASS} ${VOTE_NUMERIC_INPUT_CLASSES[variant]} tw-pl-3 ${stepControls ? "!tw-rounded-none !tw-border-0 tw-pr-14 focus-visible:tw-outline-offset-[-2px]" : "tw-pr-28"}`}
          />
          <span className={`${VOTE_NUMERIC_UNIT_CLASS} tw-right-3`}>
            {unit}
          </span>
        </div>
        {stepControls?.increase}
      </div>
      {shortcuts !== undefined && shortcuts !== null && shortcuts !== false && (
        <div className="tw-mt-2">{shortcuts}</div>
      )}
    </div>
  );
}
