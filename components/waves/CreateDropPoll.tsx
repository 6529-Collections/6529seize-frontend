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
  readonly anonymous: boolean;
  readonly onlyDroppersCanRespond: boolean;
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
  anonymous: false,
  onlyDroppersCanRespond: false,
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
      anonymous: draft.anonymous,
      only_droppers_can_respond: draft.onlyDroppersCanRespond,
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
  const anonymousInputId = useId();
  const responderScopeInputId = useId();
  const optionKeyBaseId = useId();
  const closingTimeInputRef = useRef<HTMLInputElement>(null);
  const nextOptionKeyIndexRef = useRef(draft.options.length);
  const [optionKeys, setOptionKeys] = useState<readonly string[]>(() =>
    draft.options.map((_, index) => `${optionKeyBaseId}-option-${index}`)
  );
  const createOptionKey = (): string => {
    const key = `${optionKeyBaseId}-option-${nextOptionKeyIndexRef.current}`;
    nextOptionKeyIndexRef.current += 1;
    return key;
  };
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

    setOptionKeys((current) =>
      current.filter((_, optionIndex) => optionIndex !== index)
    );
    onChange({
      ...draft,
      options: draft.options.filter((_, optionIndex) => optionIndex !== index),
    });
  };

  const addOption = () => {
    if (!canAddOption) {
      return;
    }

    const nextOptionKey = createOptionKey();
    setOptionKeys((current) => [...current, nextOptionKey]);
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

    if (typeof pickerInput.showPicker === "function") {
      try {
        pickerInput.showPicker();
      } catch {
        input.focus();
      }
      return;
    }

    input.focus();
  };

  const optionRows = draft.options.map((option, index) => ({
    index,
    key: optionKeys[index] ?? `${optionKeyBaseId}-option-${index}`,
    option,
  }));

  return (
    <div
      data-testid="create-drop-poll"
      className="tw-mt-3 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-shadow-2xl tw-shadow-black/60 tw-backdrop-blur"
    >
      <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-pb-3 tw-pt-4 sm:tw-flex sm:tw-justify-between sm:tw-gap-3">
        <div className="tw-contents sm:tw-flex sm:tw-min-w-0 sm:tw-items-center sm:tw-gap-3">
          <h3 className="tw-col-start-1 tw-row-start-1 tw-mb-0 tw-text-[13.5px] tw-font-bold tw-tracking-wide tw-text-iron-50">
            Create Poll
          </h3>
          <div className="tw-col-span-2 tw-col-start-1 tw-row-start-2 tw-flex tw-w-fit tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/60 tw-p-0.5">
            <button
              type="button"
              aria-pressed={!draft.multichoice}
              disabled={disabled}
              onClick={() => onChange({ ...draft, multichoice: false })}
              className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-transition-all tw-duration-200 disabled:tw-cursor-not-allowed ${
                draft.multichoice
                  ? "tw-bg-iron-800/60 tw-text-iron-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
                  : "tw-bg-iron-50 tw-text-iron-950 tw-shadow-sm"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              aria-pressed={draft.multichoice}
              disabled={disabled}
              onClick={() => onChange({ ...draft, multichoice: true })}
              className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-transition-all tw-duration-200 disabled:tw-cursor-not-allowed ${
                draft.multichoice
                  ? "tw-bg-iron-50 tw-text-iron-950 tw-shadow-sm"
                  : "tw-bg-iron-800/60 tw-text-iron-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
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
          className="tw-col-start-2 tw-row-start-1 tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.035] tw-p-0 tw-text-iron-300 tw-transition-all disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.06] desktop-hover:hover:tw-text-white"
        >
          <XMarkIcon className="tw-size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-py-3">
        <div className="tw-flex tw-flex-col tw-gap-2">
          {optionRows.map(({ index, key, option }) => {
            const hasOptionValue = option.trim().length > 0;

            return (
              <div
                key={key}
                className="tw-group/option tw-flex tw-items-center tw-gap-2"
              >
                <span
                  className={`tw-flex tw-size-[15px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-transition-all ${
                    draft.multichoice ? "tw-rounded-[4px]" : "tw-rounded-full"
                  } ${
                    hasOptionValue
                      ? "tw-border-iron-400 tw-bg-iron-800"
                      : "tw-border-iron-700 tw-bg-iron-900/60"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`tw-transition-all ${
                      draft.multichoice
                        ? "tw-size-[7px] tw-rounded-[2px]"
                        : "tw-size-1.5 tw-rounded-full"
                    } ${
                      hasOptionValue ? "tw-bg-iron-300" : "tw-bg-transparent"
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
                  className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3 tw-py-2.5 tw-text-[13px] tw-font-medium tw-text-iron-50 tw-outline-none tw-transition-all placeholder:tw-text-iron-500 hover:tw-border-iron-600 hover:tw-bg-iron-800 focus:tw-border-white/30 focus:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  aria-label={`Remove option ${index + 1}`}
                  disabled={disabled || !canRemoveOption}
                  onClick={() => removeOption(index)}
                  className={`tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-all disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-rose-400 ${
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

          <div className="tw-mt-1 tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-1.5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-3">
            <button
              type="button"
              disabled={disabled || !canAddOption}
              onClick={addOption}
              className="tw-flex tw-w-fit tw-flex-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-text-iron-300"
            >
              <span className="tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-dashed tw-border-iron-600">
                <PlusIcon className="tw-size-2.5" aria-hidden="true" />
              </span>
              <span className="tw-text-sm tw-font-medium">Add option</span>
            </button>
            {validationError && (
              <p className="tw-mb-0 tw-min-w-0 tw-text-left tw-text-[11px] tw-font-medium tw-text-amber-200 sm:tw-truncate sm:tw-text-right">
                {validationError}
              </p>
            )}
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-3">
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
            <label
              htmlFor={closingTimeInputId}
              className="tw-mb-0 tw-text-[11px] tw-font-medium tw-text-iron-400"
            >
              Closing time
            </label>
            <label
              htmlFor={closingTimeInputId}
              className="tw-group/closing-time tw-relative tw-mb-0 tw-flex tw-min-h-10 tw-w-full tw-cursor-pointer tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3.5 tw-py-2 tw-transition-all focus-within:tw-border-white/30 focus-within:tw-bg-iron-800 hover:tw-border-iron-600 hover:tw-bg-iron-800"
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
                className="tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-pr-8 tw-text-[13.5px] tw-font-medium tw-text-iron-100 tw-outline-none tw-transition-all [color-scheme:dark] disabled:tw-cursor-not-allowed disabled:tw-opacity-60 [&::-webkit-calendar-picker-indicator]:tw-opacity-0"
              />
              <CalendarIcon
                className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-300 tw-transition-colors group-hover/closing-time:tw-text-iron-50"
                aria-hidden="true"
              />
            </label>
          </div>
          <div className="tw-flex tw-w-full tw-flex-col tw-gap-2">
            <label
              htmlFor={responderScopeInputId}
              className={`tw-mb-0 tw-flex tw-min-h-10 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3.5 tw-py-2 tw-transition-all ${
                disabled
                  ? "tw-cursor-not-allowed tw-opacity-60"
                  : "tw-cursor-pointer hover:tw-border-iron-600 hover:tw-bg-iron-800"
              }`}
            >
              <input
                id={responderScopeInputId}
                type="checkbox"
                checked={draft.onlyDroppersCanRespond}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    onlyDroppersCanRespond: event.target.checked,
                  })
                }
                className="tw-size-4 tw-flex-shrink-0 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-accent-white disabled:tw-cursor-not-allowed"
              />
              <span className="tw-text-[12.5px] tw-font-medium tw-leading-4 tw-text-iron-200">
                Only people who can chat can respond
              </span>
            </label>
            <label
              htmlFor={anonymousInputId}
              className={`tw-mb-0 tw-flex tw-min-h-10 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3.5 tw-py-2 tw-transition-all ${
                disabled
                  ? "tw-cursor-not-allowed tw-opacity-60"
                  : "tw-cursor-pointer hover:tw-border-iron-600 hover:tw-bg-iron-800"
              }`}
            >
              <input
                id={anonymousInputId}
                type="checkbox"
                checked={draft.anonymous}
                disabled={disabled}
                onChange={(event) =>
                  onChange({ ...draft, anonymous: event.target.checked })
                }
                className="tw-size-4 tw-flex-shrink-0 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-accent-white disabled:tw-cursor-not-allowed"
              />
              <span className="tw-text-[12.5px] tw-font-medium tw-leading-4 tw-text-iron-200">
                Anonymous poll
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
