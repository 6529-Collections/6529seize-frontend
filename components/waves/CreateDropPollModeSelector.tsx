import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CONNECTED_TAB_INTERACTION_CLASSES,
  CONNECTED_TAB_SURFACE_CLASSES,
  getConnectedTabStateClasses,
} from "@/components/utils/select/tabs/connectedTabStyles";
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
      className={`${CONNECTED_TAB_SURFACE_CLASSES} tw-flex tw-w-fit tw-flex-shrink-0 tw-items-center tw-border tw-border-solid tw-p-0.5`}
    >
      <button
        type="button"
        aria-pressed={!draft.multichoice}
        disabled={disabled}
        onClick={() => onChange({ ...draft, multichoice: false })}
        className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${CONNECTED_TAB_INTERACTION_CLASSES} ${getConnectedTabStateClasses({ isActive: !draft.multichoice })}`}
      >
        {t(locale, "waves.poll.composer.mode.single")}
      </button>
      <button
        type="button"
        aria-pressed={draft.multichoice}
        disabled={disabled}
        onClick={() => onChange({ ...draft, multichoice: true })}
        className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${CONNECTED_TAB_INTERACTION_CLASSES} ${getConnectedTabStateClasses({ isActive: draft.multichoice })}`}
      >
        {t(locale, "waves.poll.composer.mode.multiple")}
      </button>
    </div>
  );
}
