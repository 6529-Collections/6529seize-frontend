"use client";

import type { ApiCreateDropPollRequest } from "@/generated/models/ApiCreateDropPollRequest";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

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

  return (
    <div className="tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/70 tw-p-3">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0">
          <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            Poll
          </h3>
          <div className="tw-mt-2 tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800">
            <button
              type="button"
              aria-pressed={!draft.multichoice}
              disabled={disabled}
              onClick={() => onChange({ ...draft, multichoice: false })}
              className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition disabled:tw-cursor-not-allowed ${
                draft.multichoice
                  ? "tw-bg-iron-900 tw-text-iron-400 desktop-hover:hover:tw-bg-iron-800"
                  : "tw-text-primary-200 tw-bg-primary-500/20"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              aria-pressed={draft.multichoice}
              disabled={disabled}
              onClick={() => onChange({ ...draft, multichoice: true })}
              className={`tw-border-0 tw-border-l tw-border-solid tw-border-iron-800 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition disabled:tw-cursor-not-allowed ${
                draft.multichoice
                  ? "tw-text-primary-200 tw-bg-primary-500/20"
                  : "tw-bg-iron-900 tw-text-iron-400 desktop-hover:hover:tw-bg-iron-800"
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
          className="tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-white/5 tw-p-0 tw-text-iron-400 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white"
        >
          <XMarkIcon className="tw-size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2">
        {draft.options.map((option, index) => (
          <div key={index} className="tw-flex tw-items-center tw-gap-2">
            <input
              type="text"
              value={option}
              disabled={disabled}
              maxLength={MAX_POLL_OPTION_LENGTH}
              aria-label={`Poll option ${index + 1}`}
              onChange={(event) => updateOption(index, event.target.value)}
              className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-50 tw-outline-none tw-transition placeholder:tw-text-iron-500 focus:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
              placeholder={`Option ${index + 1}`}
            />
            <button
              type="button"
              aria-label={`Remove option ${index + 1}`}
              disabled={disabled || !canRemoveOption}
              onClick={() => removeOption(index)}
              className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-text-iron-400 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-text-iron-100"
            >
              <TrashIcon className="tw-size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <label className="tw-min-w-0 tw-flex-1">
          <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-iron-400">
            Closing time
          </span>
          <input
            type="datetime-local"
            min={minClosingTime}
            value={draft.closingTime}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...draft, closingTime: event.target.value })
            }
            className="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-50 tw-outline-none tw-transition focus:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          />
        </label>
        <button
          type="button"
          disabled={disabled || !canAddOption}
          onClick={addOption}
          className="tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800"
        >
          <PlusIcon className="tw-size-4" aria-hidden="true" />
          <span>Add option</span>
        </button>
      </div>

      {validationError && (
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-text-amber-200">
          {validationError}
        </p>
      )}
    </div>
  );
}
