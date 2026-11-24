"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import Button from "@/components/utils/button/Button";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  MY_VOTES_EFFECT_TRANSITION,
  MY_VOTES_FADE_TRANSITION,
} from "./myVotesMotion";

export const MY_VOTES_INPUT_LAYOUT =
  "tw-col-span-3 tw-row-start-2 tw-w-full tw-min-w-0 [&_input]:tw-text-sm @[32rem]/my-vote:tw-col-span-2 @[32rem]/my-vote:tw-col-start-2 @[46rem]/my-vote:tw-col-span-1 @[46rem]/my-vote:tw-col-start-4 @[46rem]/my-vote:tw-row-start-1 @[46rem]/my-vote:tw-self-center";

interface MyVotesInputProps {
  readonly mobile: boolean;
  readonly className?: string | undefined;
  readonly alwaysShowHelper?: boolean | undefined;
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly currentVote: number;
  readonly unit: string;
  readonly min: number;
  readonly valid: boolean;
  readonly disabled: boolean;
  readonly busy: boolean;
  readonly helperText: string;
  readonly error?: string | null | undefined;
  readonly saveLabel: string;
  readonly saveAriaLabel?: string | undefined;
  readonly explainLabel: string;
  readonly explainDescription: string;
  readonly canExplain: boolean;
  readonly onChange: (value: string) => void;
  readonly onBlur?: (() => void) | undefined;
  readonly onSubmit: () => void;
  readonly onExplain?: (() => void) | undefined;
}

function MyVotesExplainButton({
  mobile,
  disabled,
  onExplain,
  tooltipId,
  label,
  description,
}: {
  readonly mobile: boolean;
  readonly disabled: boolean;
  readonly onExplain: () => void;
  readonly tooltipId: string;
  readonly label: string;
  readonly description: string;
}) {
  const props = {
    type: "button" as const,
    disabled,
    onClick: onExplain,
    "data-tooltip-id": tooltipId,
    "data-tooltip-content": description,
  };
  if (mobile)
    return (
      <button
        {...props}
        className="tw-min-h-11 tw-min-w-11 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
      >
        {label}
      </button>
    );
  return (
    <Button
      {...props}
      variant="tertiary"
      size="sm"
      className="!tw-min-h-11 tw-min-w-11 tw-whitespace-nowrap !tw-px-3 !tw-text-xs !tw-font-medium"
    >
      {label}
    </Button>
  );
}

/** Presentation shared by My Votes adapters; the adapter owns voting rules. */
export function MyVotesInput({
  mobile,
  className = MY_VOTES_INPUT_LAYOUT,
  alwaysShowHelper = false,
  id,
  label,
  value,
  currentVote,
  unit,
  min,
  valid,
  disabled,
  busy,
  helperText,
  error,
  saveLabel,
  saveAriaLabel,
  explainLabel,
  explainDescription,
  canExplain,
  onChange,
  onBlur,
  onSubmit,
  onExplain,
}: MyVotesInputProps) {
  const locale = useBrowserLocale();
  const reduceMotion = useReducedMotion();
  const explainTooltipId = useId();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const numeric = Number(value);
  const hasNumber = /^-?\d+$/.test(value) && Number.isSafeInteger(numeric);
  const changed = hasNumber && numeric !== currentVote;
  useEffect(() => {
    if (!changed && !busy && document.activeElement === saveRef.current) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [changed, busy]);
  const showHelper = alwaysShowHelper || focused || !valid || !!error;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy = [showHelper ? helperId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <form
        data-vote-controls
        className={`tw-grid tw-w-full tw-min-w-0 tw-cursor-default tw-grid-cols-[minmax(0,1fr)_auto] tw-items-start tw-gap-x-2 tw-gap-y-1 ${className}`}
        onSubmit={(event) => {
          event.preventDefault();
          if (changed && valid && !disabled && !busy) onSubmit();
        }}
      >
        <label htmlFor={id} className="tw-sr-only">
          {label}
        </label>
        <div
          data-my-vote-field
          className={`tw-flex tw-min-w-0 tw-items-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-pr-1 focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 ${onExplain ? "" : "tw-col-span-2"} ${!valid || error ? "tw-ring-2 tw-ring-inset tw-ring-rose-400" : ""}`}
        >
          <input
            ref={inputRef}
            id={id}
            type="text"
            // A numeric iOS keyboard has no minus key. The text keyboard retains it.
            inputMode={min < 0 ? "text" : "numeric"}
            autoComplete="off"
            spellCheck={false}
            value={
              focused || !hasNumber ? value : formatInteger(locale, numeric)
            }
            disabled={disabled || busy}
            aria-invalid={!valid || !!error}
            aria-describedby={describedBy || undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            onChange={(event) => {
              const next = event.target.value.replaceAll(",", "").trim();
              if (/^-?\d*$/.test(next)) onChange(next);
            }}
            className="tw-h-11 tw-w-0 tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-py-0 tw-pl-3 tw-pr-1 tw-text-base tw-font-semibold !tw-tabular-nums tw-text-iron-50 tw-outline-none focus:tw-ring-0 disabled:tw-opacity-50"
          />
          <span className="tw-max-w-[40%] tw-shrink-0 tw-truncate tw-px-1 tw-text-xs tw-text-iron-400">
            {unit}
          </span>
          <AnimatePresence initial={false}>
            {(changed || busy) && (
              <motion.button
                ref={saveRef}
                key="save"
                type="submit"
                disabled={disabled || busy || !valid}
                aria-busy={busy || undefined}
                aria-label={saveAriaLabel}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
                transition={
                  reduceMotion
                    ? MY_VOTES_FADE_TRANSITION
                    : MY_VOTES_EFFECT_TRANSITION
                }
                className={`tw-min-h-11 tw-min-w-11 tw-shrink-0 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-transparent tw-text-xs tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 ${mobile ? "tw-px-2 tw-text-primary-300" : "tw-px-0 tw-py-1 tw-text-white"}`}
              >
                {mobile ? (
                  saveLabel
                ) : (
                  <span className="tw-flex tw-h-9 tw-items-center tw-justify-center tw-rounded-md tw-bg-primary-500 tw-px-2">
                    {saveLabel}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {onExplain && (
          <MyVotesExplainButton
            mobile={mobile}
            disabled={!canExplain || busy || disabled}
            onExplain={onExplain}
            tooltipId={explainTooltipId}
            label={explainLabel}
            description={explainDescription}
          />
        )}
        {showHelper && (
          <p
            id={helperId}
            className="tw-col-span-2 tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {helperText}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="tw-col-span-2 tw-m-0 tw-text-xs tw-leading-5 tw-text-rose-300"
          >
            {error}
          </p>
        )}
      </form>
      {onExplain && (
        <BodyPortalTooltip
          id={explainTooltipId}
          place="top"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
          className="tw-max-w-64 tw-whitespace-normal"
          closeEvents={{ mouseleave: true, blur: true, click: true }}
          globalCloseEvents={{
            escape: true,
            clickOutsideAnchor: true,
            scroll: true,
          }}
        />
      )}
    </>
  );
}
