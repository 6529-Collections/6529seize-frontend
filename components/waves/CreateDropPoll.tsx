"use client";

import type { ApiCreateDropPollRequest } from "@/generated/models/ApiCreateDropPollRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useId, useRef, useState } from "react";
import CreateDropPollModeSelector from "./CreateDropPollModeSelector";
import CreateDropPollSettings from "./CreateDropPollSettings";
import PollComposerOptions from "./PollComposerOptions";

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
  readonly presentation?: "inline" | "sheet";
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
  draft: CreateDropPollDraft | null,
  locale: SupportedLocale = DEFAULT_LOCALE
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
      error: t(locale, "waves.poll.composer.validation.minimumOptions", {
        count: MIN_POLL_OPTIONS,
      }),
    };
  }

  if (options.some((option) => option.length > MAX_POLL_OPTION_LENGTH)) {
    return {
      request: null,
      error: t(locale, "waves.poll.composer.validation.optionLength", {
        max: MAX_POLL_OPTION_LENGTH,
      }),
    };
  }

  if (getUniqueNormalizedOptions(options).size !== options.length) {
    return {
      request: null,
      error: t(locale, "waves.poll.composer.validation.uniqueOptions"),
    };
  }

  const closingTime = new Date(draft.closingTime).getTime();
  if (!Number.isFinite(closingTime) || closingTime <= Date.now()) {
    return {
      request: null,
      error: t(locale, "waves.poll.composer.validation.futureClosingTime"),
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
  presentation = "inline",
}: CreateDropPollProps) {
  const locale = useBrowserLocale();
  const isSheet = presentation === "sheet";
  const canAddOption = draft.options.length < MAX_POLL_OPTIONS;
  const canRemoveOption = draft.options.length > MIN_POLL_OPTIONS;
  const closingTimeInputId = useId();
  const modeDescriptionId = useId();
  const validationErrorId = useId();
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
    id: optionKeys[index] ?? `${optionKeyBaseId}-option-${index}`,
    value: option,
  }));

  return (
    <div
      data-testid="create-drop-poll"
      role="group"
      aria-label={t(locale, "waves.poll.composer.title")}
      aria-describedby={validationError ? validationErrorId : undefined}
      className={
        isSheet
          ? "tw-flex-none tw-overflow-hidden tw-bg-iron-950"
          : "-tw-mx-4 -tw-mb-2 tw-mt-3 tw-overflow-hidden tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-900"
      }
    >
      {isSheet ? (
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-pb-3 tw-pt-1">
          <CreateDropPollModeSelector
            multi={draft.multichoice}
            disabled={disabled}
            descriptionId={modeDescriptionId}
            locale={locale}
            onChange={(multi) => onChange({ ...draft, multichoice: multi })}
          />
        </div>
      ) : (
        <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-py-3 sm:tw-flex sm:tw-items-center sm:tw-justify-between sm:tw-gap-3">
          <div className="tw-contents sm:tw-flex sm:tw-min-w-0 sm:tw-items-center sm:tw-gap-3">
            <h3 className="tw-col-start-1 tw-row-start-1 tw-m-0 tw-flex tw-h-8 tw-items-center tw-text-[13.5px] tw-font-bold tw-tracking-wide tw-text-iron-50">
              {t(locale, "waves.poll.composer.title")}
            </h3>
            <div className="tw-col-span-2 tw-col-start-1 tw-row-start-2 sm:tw-flex sm:tw-items-center">
              <CreateDropPollModeSelector
                multi={draft.multichoice}
                disabled={disabled}
                descriptionId={modeDescriptionId}
                locale={locale}
                onChange={(multi) => onChange({ ...draft, multichoice: multi })}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label={t(locale, "waves.poll.composer.remove")}
            disabled={disabled}
            onClick={onRemove}
            className="tw-col-start-2 tw-row-start-1 tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-white"
          >
            <XMarkIcon className="tw-size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-py-3">
        <p
          id={modeDescriptionId}
          className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400"
        >
          {t(
            locale,
            draft.multichoice
              ? "waves.poll.composer.mode.multipleDescription"
              : "waves.poll.composer.mode.singleDescription"
          )}
        </p>
        <PollComposerOptions
          options={optionRows}
          multi={draft.multichoice}
          disabled={disabled}
          maxOptions={MAX_POLL_OPTIONS}
          maxOptionLength={MAX_POLL_OPTION_LENGTH}
          validationError={validationError}
          validationErrorId={validationErrorId}
          locale={locale}
          onAdd={addOption}
          onChange={updateOption}
          onRemove={removeOption}
        />

        <CreateDropPollSettings
          draft={draft}
          disabled={disabled}
          locale={locale}
          closingTimeInputId={closingTimeInputId}
          minClosingTime={minClosingTime}
          closingTimeInputRef={closingTimeInputRef}
          responderScopeInputId={responderScopeInputId}
          anonymousInputId={anonymousInputId}
          onChange={onChange}
          onOpenClosingTimePicker={openClosingTimePicker}
        />
      </div>
    </div>
  );
}
