import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

export enum CreateWaveApprovalHoldMode {
  NONE = "NONE",
  HOLD = "HOLD",
}

const APPROVAL_HOLD_OPTIONS: readonly {
  readonly mode: CreateWaveApprovalHoldMode;
  readonly labelKey: MessageKey;
  readonly descriptionKey: MessageKey;
}[] = [
  {
    mode: CreateWaveApprovalHoldMode.NONE,
    labelKey: "waves.create.voting.approvalHold.none.label",
    descriptionKey: "waves.create.voting.approvalHold.none.description",
  },
  {
    mode: CreateWaveApprovalHoldMode.HOLD,
    labelKey: "waves.create.voting.approvalHold.required.label",
    descriptionKey: "waves.create.voting.approvalHold.required.description",
  },
];

export const getCreateWaveApprovalHoldMode = ({
  thresholdTimeMs,
}: {
  readonly thresholdTimeMs: number | null;
}): CreateWaveApprovalHoldMode => {
  if (thresholdTimeMs !== null && Number.isFinite(thresholdTimeMs)) {
    return CreateWaveApprovalHoldMode.HOLD;
  }

  return CreateWaveApprovalHoldMode.NONE;
};

export default function CreateWaveApprovalHold({
  selectedMode,
  onModeChange,
}: {
  readonly selectedMode: CreateWaveApprovalHoldMode;
  readonly onModeChange: (mode: CreateWaveApprovalHoldMode) => void;
}) {
  const locale = useBrowserLocale();

  return (
    <fieldset className="tw-mt-6 tw-border-0 tw-p-0">
      <legend className="tw-mb-3 tw-mt-0 tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
        {t(locale, "waves.create.voting.approvalHold.legend")}
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
        {APPROVAL_HOLD_OPTIONS.map((option) => {
          const selected = selectedMode === option.mode;
          return (
            <label
              key={option.mode}
              className={`tw-flex tw-cursor-pointer tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                selected
                  ? "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-500/30"
                  : "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-ring-white/10"
              }`}
            >
              <input
                type="radio"
                name="approval-hold-mode"
                value={option.mode}
                checked={selected}
                onChange={() => onModeChange(option.mode)}
                className="tw-form-radio tw-mt-1 tw-h-4 tw-w-4 tw-cursor-pointer tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-800 tw-text-primary-400 tw-ring-offset-iron-800 tw-transition tw-duration-300 tw-ease-out focus:tw-ring-2 focus:tw-ring-primary-400"
              />
              <span className="tw-min-w-0">
                <span
                  className={`tw-block tw-text-sm tw-font-semibold ${
                    selected ? "tw-text-white" : "tw-text-iron-200"
                  }`}
                >
                  {t(locale, option.labelKey)}
                </span>
                <span
                  className={`tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-4 ${
                    selected ? "tw-text-iron-300" : "tw-text-iron-400"
                  }`}
                >
                  {t(locale, option.descriptionKey)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
