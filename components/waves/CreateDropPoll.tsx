"use client";

import type { ApiCreateDropPollRequest } from "@/generated/models/ApiCreateDropPollRequest";
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useId, useRef, useState } from "react";

export interface CreateDropPollDraft {
  readonly options: readonly string[];
  readonly multichoice: boolean;
  readonly closingTime: string;
}

interface CreateDropPollProps {
  readonly draft: CreateDropPollDraft;
  readonly disabled: boolean;
  readonly validationError: string | null;
  readonly onChange: (draft: CreateDropPollDraft) => void;
  readonly onRemove: () => void;
}

const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 100;
const MAX_POLL_OPTION_LENGTH = 500;
const DEFAULT_POLL_DURATION_MS = 24 * 60 * 60 * 1000;

const padDatePart = (value: number): string =>
  value.toString().padStart(2, "0");

const toDateTimeLocalValue = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const createDefaultDropPollDraft = (): CreateDropPollDraft => ({
  options: ["", ""],
  multichoice: false,
  closingTime: toDateTimeLocalValue(Date.now() + DEFAULT_POLL_DURATION_MS),
});

const getUniqueNormalizedOptions = (options: readonly string[]): Set<string> =>
  new Set(options.map((option) => option.trim().toLowerCase()));

export const validateCreateDropPollDraft = (
  draft: CreateDropPollDraft | null
): {
  readonly request: ApiCreateDropPollRequest | null;
  readonly error: string | null;
} => {
  if (!draft) {
    return { request: null, error: null };
  }

  const options = draft.options
    .map((option) => option.trim())
    .filter((option) => option.length > 0);

  if (options.length < MIN_POLL_OPTIONS) {
    return {
      request: null,
      error: `Add at least ${MIN_POLL_OPTIONS} options.`,
    };
  }

  if (options.some((option) => option.length > MAX_POLL_OPTION_LENGTH)) {
    return {
      request: null,
      error: `Options can be up to ${MAX_POLL_OPTION_LENGTH} characters.`,
    };
  }

  if (getUniqueNormalizedOptions(options).size !== options.length) {
    return {
      request: null,
      error: "Poll options must be unique.",
    };
  }

  const closingTime = new Date(draft.closingTime).getTime();
  if (!Number.isFinite(closingTime) || closingTime <= Date.now()) {
    return {
      request: null,
      error: "Choose a future closing time.",
    };
  }

  return {
    request: {
      options,
      multichoice: draft.multichoice,
      closing_time: closingTime,
    } as unknown as ApiCreateDropPollRequest,
    error: null,
  };
};

export default function CreateDropPoll({
  draft,
  disabled,
  validationError,
  onChange,
  onRemove,
}: CreateDropPollProps) {
  const canAddOption = draft.options.length < MAX_POLL_OPTIONS;
  const canRemoveOption = draft.options.length > MIN_POLL_OPTIONS;
  const closingTimeInputId = useId();
  const closingTimeInputRef = useRef<HTMLInputElement>(null);
  const [minClosingTime] = useState(() =>
    toDateTimeLocalValue(Date.now() + 60_000)
  );

  const updateOption = (index: number, value: string) => {
    onChange({
      ...draft,
      options: draft.options.map((option, optionIndex) =>
        optionIndex === index ? value : option
      ),
    });
  };

  const removeOption = (index: number) => {
    if (!canRemoveOption) {
      return;
    }

    onChange({
      ...draft,
      options: draft.options.filter((_, optionIndex) => optionIndex !== index),
    });
  };

  const addOption = () => {
    if (!canAddOption) {
      return;
    }

    onChange({
      ...draft,
      options: [...draft.options, ""],
    });
  };

  const openClosingTimePicker = () => {
    if (disabled) {
      return;
    }

    const input = closingTimeInputRef.current;
    if (!input) {
      return;
    }

    const pickerInput = input as HTMLInputElement & {
      readonly showPicker?: () => void;
    };

    if (pickerInput.showPicker) {
      try {
        pickerInput.showPicker();
      } catch {
        input.focus();
      }
      return;
    }

    input.focus();
  };

  return (
    <div className="tw-mt-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/60">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.05] tw-px-4 tw-pb-3 tw-pt-4">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
          <h3 className="tw-mb-0 tw-text-[13px] tw-font-bold tw-tracking-wide tw-text-white">
            Create Poll
          </h3>
          <div className="tw-flex tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-iron-900 tw-p-0.5">
            <button
              type="button"
              aria-pressed={!draft.multichoice}
              disabled={disabled}
              onClick={() => onChange({ ...draft, multichoice: false })}
              className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-[11.5px] tw-font-semibold tw-transition-all tw-duration-200 disabled:tw-cursor-not-allowed ${
                draft.multichoice
                  ? "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-200"
                  : "tw-bg-white tw-text-black tw-shadow-sm"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              aria-pressed={draft.multichoice}
              disabled={disabled}
              onClick={() => onChange({ ...draft, multichoice: true })}
              className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-[11.5px] tw-font-semibold tw-transition-all tw-duration-200 disabled:tw-cursor-not-allowed ${
                draft.multichoice
                  ? "tw-bg-white tw-text-black tw-shadow-sm"
                  : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-200"
              }`}
            >
              Multiple
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Remove poll"
          disabled={disabled}
          onClick={onRemove}
          className="tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.025] tw-p-0 tw-text-iron-400 tw-transition-all disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-white"
        >
          <XMarkIcon className="tw-size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-py-3">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {draft.options.map((option, index) => {
            const hasOptionValue = option.trim().length > 0;

            return (
              <div
                key={index}
                className="tw-group/option tw-flex tw-items-center tw-gap-2"
              >
                <span
                  className={`tw-flex tw-size-[15px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-transition-all ${
                    draft.multichoice ? "tw-rounded-[4px]" : "tw-rounded-full"
                  } ${
                    hasOptionValue
                      ? "tw-border-white/30 tw-bg-white/[0.05]"
                      : "tw-border-white/10 tw-bg-transparent"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`tw-transition-all ${
                      draft.multichoice
                        ? "tw-size-[7px] tw-rounded-[2px]"
                        : "tw-size-1.5 tw-rounded-full"
                    } ${
                      hasOptionValue ? "tw-bg-white/40" : "tw-bg-transparent"
                    }`}
                  />
                </span>
                <input
                  type="text"
                  value={option}
                  disabled={disabled}
                  maxLength={MAX_POLL_OPTION_LENGTH}
                  aria-label={`Poll option ${index + 1}`}
                  onChange={(event) => updateOption(index, event.target.value)}
                  className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-[13px] tw-font-medium tw-text-white tw-outline-none tw-transition-all placeholder:tw-text-iron-600 hover:tw-border-white/[0.12] hover:tw-bg-white/[0.055] focus:tw-border-white/20 focus:tw-bg-white/[0.055] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  aria-label={`Remove option ${index + 1}`}
                  disabled={disabled || !canRemoveOption}
                  onClick={() => removeOption(index)}
                  className={`tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-rose-400 ${
                    canRemoveOption && !disabled
                      ? "tw-opacity-80 desktop-hover:hover:tw-opacity-100"
                      : "tw-opacity-40"
                  }`}
                >
                  <TrashIcon className="tw-size-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}

          <div className="tw-mt-1 tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3">
            <button
              type="button"
              disabled={disabled || !canAddOption}
              onClick={addOption}
              className="tw-flex tw-w-fit tw-flex-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-text-iron-300"
            >
              <span className="tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-dashed tw-border-white/15">
                <PlusIcon className="tw-size-2.5" aria-hidden="true" />
              </span>
              <span className="tw-text-sm tw-font-medium">Add option</span>
            </button>
            {validationError && (
              <p className="tw-mb-0 tw-min-w-0 tw-truncate tw-text-right tw-text-[11px] tw-font-medium tw-text-amber-200">
                {validationError}
              </p>
            )}
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pt-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5 sm:tw-flex-row sm:tw-items-center">
            <label
              htmlFor={closingTimeInputId}
              className="tw-mb-0 tw-text-[11px] tw-font-medium tw-text-iron-600"
            >
              Closing time
            </label>
            <label
              htmlFor={closingTimeInputId}
              className="tw-group/closing-time tw-relative tw-mb-0 tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.045] tw-px-3 tw-py-2 tw-transition-all focus-within:tw-border-white/25 focus-within:tw-bg-white/[0.06] hover:tw-border-white/20 hover:tw-bg-white/[0.06] sm:tw-w-auto"
            >
              <input
                id={closingTimeInputId}
                ref={closingTimeInputRef}
                type="datetime-local"
                min={minClosingTime}
                value={draft.closingTime}
                disabled={disabled}
                onClick={openClosingTimePicker}
                onChange={(event) =>
                  onChange({ ...draft, closingTime: event.target.value })
                }
                className="tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-pr-8 tw-text-[13px] tw-font-medium tw-text-iron-200 tw-outline-none tw-transition-all [color-scheme:dark] disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-flex-none [&::-webkit-calendar-picker-indicator]:tw-opacity-0"
              />
              <CalendarIcon
                className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-400 tw-transition-colors group-hover/closing-time:tw-text-iron-100"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
