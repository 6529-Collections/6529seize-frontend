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
              className={`tw-group tw-flex tw-cursor-pointer tw-items-start tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-transition tw-duration-300 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400 ${
                selected
                  ? "tw-border-primary-500/60 tw-bg-primary-500/5 tw-shadow-inner"
                  : "tw-border-white/5 tw-bg-iron-950/40 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-950/60"
              }`}
            >
              <input
                type="radio"
                name="approval-hold-mode"
                value={option.mode}
                checked={selected}
                onChange={() => onModeChange(option.mode)}
                className="tw-peer tw-sr-only"
              />
              <span
                aria-hidden="true"
                className={`tw-mt-0.5 tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out ${
                  selected
                    ? "tw-border-primary-400 tw-bg-primary-500/10"
                    : "tw-border-iron-600 tw-bg-transparent group-hover:tw-border-iron-500"
                }`}
              >
                <span
                  className={`tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-transition tw-duration-200 ${
                    selected ? "tw-scale-100" : "tw-scale-0"
                  }`}
                />
              </span>
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
