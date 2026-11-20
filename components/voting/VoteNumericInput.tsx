"use client";

import type { ComponentProps } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  VOTE_NUMERIC_INPUT_BASE_CLASS,
  VOTE_NUMERIC_INPUT_CLASSES,
  VOTE_NUMERIC_UNIT_CLASS,
  type VoteControlVariant,
} from "./VoteControl.styles";
import {
  type VoteNumericAdjustments,
  useVoteNumericSteps,
} from "./useVoteNumericSteps";

const PERCENTAGES = [-100, -50, 50, 100];
const STEP_BUTTON_CLASS =
  "tw-flex tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-self-stretch tw-border-y-0 tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 enabled:active:tw-bg-iron-700 disabled:tw-opacity-50 desktop-hover:enabled:hover:tw-bg-iron-800 desktop-hover:enabled:hover:tw-text-iron-50 touch-only:tw-w-11";

type VoteNumericInputProps = Omit<
  ComponentProps<"input">,
  "size" | "className" | "children"
> & {
  readonly unit: string;
  readonly variant: VoteControlVariant;
  readonly adjustments?: VoteNumericAdjustments | undefined;
};

export function VoteNumericInput({
  unit,
  variant,
  adjustments: controls,
  ...inputProps
}: VoteNumericInputProps) {
  const disabled = inputProps.disabled === true || inputProps.readOnly === true;
  const steps = useVoteNumericSteps(controls, disabled);
  const locale = useBrowserLocale();
  const fieldClass = `${VOTE_NUMERIC_INPUT_BASE_CLASS} ${VOTE_NUMERIC_INPUT_CLASSES[variant]} tw-pl-3`;

  if (!controls) {
    return (
      <div className="tw-relative">
        <input {...inputProps} className={`${fieldClass} tw-pr-28`} />
        <span className={`${VOTE_NUMERIC_UNIT_CLASS} tw-right-3`}>{unit}</span>
      </div>
    );
  }

  const stepButton = (direction: -1 | 1) => {
    const increase = direction === 1;
    const Icon = increase ? ArrowUpIcon : ArrowDownIcon;
    const stop = () => steps.stop(direction);
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label={t(
          locale,
          increase ? "waves.vote.increaseLabel" : "waves.vote.decreaseLabel"
        )}
        onPointerDown={(event) => {
          if (event.button > 0 || event.isPrimary === false) return;
          steps.start(direction);
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={steps.resetPointer}
        onLostPointerCapture={stop}
        onBlur={stop}
        onKeyDown={steps.resetPointer}
        onClick={(event) => steps.click(direction, event.detail)}
        className={`${STEP_BUTTON_CLASS} ${increase ? "tw-border-l tw-border-r-0" : "tw-border-l-0 tw-border-r"}`}
      >
        <Icon aria-hidden="true" className="tw-size-[15px]" />
      </button>
    );
  };

  return (
    <div>
      <div
        data-vote-numeric-stepper
        className="tw-flex tw-min-w-0 tw-items-stretch tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900"
      >
        {stepButton(-1)}
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center">
          <input
            {...inputProps}
            className={`${fieldClass} !tw-rounded-none !tw-border-0 tw-pr-1 focus-visible:tw-outline-offset-[-2px]`}
          />
          <span className="tw-max-w-[48%] tw-shrink-0 tw-truncate tw-pr-3 tw-text-xs tw-text-iron-400">
            {unit}
          </span>
        </div>
        {stepButton(1)}
      </div>
      <div className="tw-mt-2 tw-flex tw-w-full tw-gap-1.5">
        {PERCENTAGES.filter(
          (percentage) => percentage > 0 || controls.min < 0
        ).map((percentage) => (
          <button
            type="button"
            key={percentage}
            disabled={disabled || (percentage > 0 && controls.max < 0)}
            onClick={() => {
              const bound = percentage < 0 ? controls.min : controls.max;
              steps.setValue(Math.round((Math.abs(percentage) / 100) * bound));
            }}
            className="tw-min-w-0 tw-flex-1 tw-rounded tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-medium tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 enabled:active:tw-bg-iron-700 disabled:tw-opacity-50 desktop-hover:enabled:hover:tw-bg-iron-800 desktop-hover:enabled:hover:tw-text-iron-50"
          >
            {percentage > 0 ? "+" : ""}
            {percentage}%
          </button>
        ))}
      </div>
    </div>
  );
}
