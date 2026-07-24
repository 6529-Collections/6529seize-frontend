import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function CreateWaveOutcomeFormActions({
  onCancel,
  onSubmit,
}: {
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-3">
      <button
        onClick={onCancel}
        type="button"
        className="tw-relative tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-700 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        {t(DEFAULT_LOCALE, "waves.create.outcomes.cancel")}
      </button>
      <PrimaryButton
        onClicked={onSubmit}
        disabled={false}
        loading={false}
        padding="tw-px-4 tw-py-3"
        className="tw-min-h-11 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        {t(DEFAULT_LOCALE, "waves.create.outcomes.addOutcome")}
      </PrimaryButton>
    </div>
  );
}
