import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { CalendarIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { RefObject } from "react";
import type { CreateDropPollDraft } from "./CreateDropPoll";

interface CreateDropPollSettingsProps {
  readonly draft: CreateDropPollDraft;
  readonly disabled: boolean;
  readonly locale: SupportedLocale;
  readonly closingTimeInputId: string;
  readonly minClosingTime: string;
  readonly closingTimeInputRef: RefObject<HTMLInputElement | null>;
  readonly responderScopeInputId: string;
  readonly anonymousInputId: string;
  readonly onChange: (draft: CreateDropPollDraft) => void;
  readonly onOpenClosingTimePicker: () => void;
}

function PollCheckbox({
  id,
  checked,
  disabled,
  label,
  onChange,
}: {
  readonly id: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`tw-mb-0 tw-flex tw-min-h-10 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3.5 tw-py-2 tw-transition-all ${
        disabled
          ? "tw-cursor-not-allowed tw-opacity-60"
          : "tw-cursor-pointer hover:tw-border-iron-600 hover:tw-bg-iron-800"
      }`}
    >
      <span className="tw-relative tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="tw-peer tw-sr-only"
        />
        <span
          aria-hidden="true"
          className={`tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded tw-border tw-border-solid tw-transition-colors peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-800 ${
            checked
              ? "tw-border-primary-400 tw-bg-primary-500"
              : "tw-border-iron-600 tw-bg-iron-950"
          }`}
        >
          <CheckIcon
            className={`tw-size-3 tw-text-white tw-transition-opacity ${
              checked ? "tw-opacity-100" : "tw-opacity-0"
            }`}
            strokeWidth={2.5}
          />
        </span>
      </span>
      <span className="tw-text-[12.5px] tw-font-medium tw-leading-4 tw-text-iron-200">
        {label}
      </span>
    </label>
  );
}

export default function CreateDropPollSettings({
  draft,
  disabled,
  locale,
  closingTimeInputId,
  minClosingTime,
  closingTimeInputRef,
  responderScopeInputId,
  anonymousInputId,
  onChange,
  onOpenClosingTimePicker,
}: CreateDropPollSettingsProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-3">
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
        <label
          htmlFor={closingTimeInputId}
          className="tw-mb-0 tw-text-[12.5px] tw-font-medium tw-leading-4 tw-text-iron-400"
        >
          {t(locale, "waves.poll.composer.closingTime")}
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
            onClick={onOpenClosingTimePicker}
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
        <PollCheckbox
          id={responderScopeInputId}
          checked={draft.onlyDroppersCanRespond}
          disabled={disabled}
          label={t(locale, "waves.poll.composer.onlyDroppersCanRespond")}
          onChange={(checked) =>
            onChange({ ...draft, onlyDroppersCanRespond: checked })
          }
        />
        <PollCheckbox
          id={anonymousInputId}
          checked={draft.anonymous}
          disabled={disabled}
          label={t(locale, "waves.poll.composer.anonymous")}
          onChange={(checked) => onChange({ ...draft, anonymous: checked })}
        />
      </div>
    </div>
  );
}
