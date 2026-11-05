import { AboutEditError, getAboutErrorType } from "./about-statement-errors";
import type { Ref } from "react";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderAboutInput({
  id,
  value,
  onChange,
  errorMsg,
  required = false,
  inputRef,
}: {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly errorMsg: string | null;
  readonly required?: boolean;
  readonly inputRef?: Ref<HTMLTextAreaElement>;
}) {
  const MAX_STATEMENT_LENGTH = 500;
  const characterCount = getUserProfileHeaderMessage(
    "user.profileHeader.aboutEdit.characterCount",
    {
      count: formatInteger(DEFAULT_LOCALE, value.length),
      max: formatInteger(DEFAULT_LOCALE, MAX_STATEMENT_LENGTH),
    }
  );
  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-200 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 hover:tw-ring-white/15">
      <textarea
        className="tw-block tw-min-h-32 tw-w-full tw-resize-none tw-border-0 tw-bg-transparent tw-px-4 tw-pb-2 tw-pt-3.5 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-50 tw-caret-primary-400 placeholder:tw-text-iron-600 focus:tw-outline-none"
        name="profile-about"
        id={id}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.aboutEdit.textareaLabel"
        )}
        aria-invalid={
          errorMsg !== null &&
          getAboutErrorType(errorMsg) !== AboutEditError.UNKNOWN
        }
        aria-describedby={
          errorMsg
            ? `${id}-character-count ${id}-profile-about-error`
            : `${id}-character-count`
        }
        placeholder={getUserProfileHeaderMessage(
          "user.profileHeader.aboutEdit.placeholder"
        )}
        maxLength={MAX_STATEMENT_LENGTH}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        ref={inputRef}
      ></textarea>
      <div className="tw-flex tw-justify-end tw-px-3 tw-pb-2">
        <div
          id={`${id}-character-count`}
          className="tw-pointer-events-none tw-rounded-full tw-bg-black/60 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-500 tw-ring-1 tw-ring-inset tw-ring-white/10"
        >
          {characterCount}
        </div>
      </div>
    </div>
  );
}
