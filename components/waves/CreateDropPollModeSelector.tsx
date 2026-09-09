import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CreateDropPollDraft } from "./CreateDropPoll";

interface CreateDropPollModeSelectorProps {
  readonly draft: CreateDropPollDraft;
  readonly disabled: boolean;
  readonly descriptionId: string;
  readonly locale: SupportedLocale;
  readonly onChange: (draft: CreateDropPollDraft) => void;
}

export default function CreateDropPollModeSelector({
  draft,
  disabled,
  descriptionId,
  locale,
  onChange,
}: CreateDropPollModeSelectorProps) {
  return (
    <div
      role="group"
      aria-label={t(locale, "waves.poll.composer.mode.groupLabel")}
      aria-describedby={descriptionId}
      className="tw-flex tw-w-fit tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/60 tw-p-0.5"
    >
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
        {t(locale, "waves.poll.composer.mode.single")}
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
        {t(locale, "waves.poll.composer.mode.multiple")}
      </button>
    </div>
  );
}
