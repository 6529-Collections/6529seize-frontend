import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  CONNECTED_TAB_INTERACTION_CLASSES,
  CONNECTED_TAB_SURFACE_CLASSES,
  getConnectedTabStateClasses,
} from "@/components/utils/select/tabs/connectedTabStyles";

interface CreateDropPollModeSelectorProps {
  readonly multi: boolean;
  readonly disabled: boolean;
  readonly descriptionId: string;
  readonly locale: SupportedLocale;
  readonly onChange: (multi: boolean) => void;
}

export default function CreateDropPollModeSelector({
  multi,
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
        aria-pressed={!multi}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${CONNECTED_TAB_INTERACTION_CLASSES} ${getConnectedTabStateClasses({ isActive: !multi })}`}
      >
        {t(locale, "waves.poll.composer.mode.single")}
      </button>
      <button
        type="button"
        aria-pressed={multi}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${CONNECTED_TAB_INTERACTION_CLASSES} ${getConnectedTabStateClasses({ isActive: multi })}`}
      >
        {t(locale, "waves.poll.composer.mode.multiple")}
      </button>
    </div>
  );
}
