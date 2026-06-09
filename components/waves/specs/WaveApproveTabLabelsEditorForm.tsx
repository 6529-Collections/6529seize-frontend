import {
  APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  getEffectiveApproveWaveTabLabels,
} from "@/helpers/waves/wave-metadata.helpers";
import type { CreateWaveApproveDisplayConfig } from "@/types/waves.types";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

interface WaveApproveTabLabelsEditorFormProps {
  readonly disabled: boolean;
  readonly display: CreateWaveApproveDisplayConfig;
  readonly errorMessage: string | null;
  readonly onCancel: () => void;
  readonly onDisplayChange: (display: CreateWaveApproveDisplayConfig) => void;
  readonly onSave: () => void;
  readonly onUseDefaults: () => void;
  readonly saveDisabled: boolean;
}

export default function WaveApproveTabLabelsEditorForm({
  disabled,
  display,
  errorMessage,
  onCancel,
  onDisplayChange,
  onSave,
  onUseDefaults,
  saveDisabled,
}: WaveApproveTabLabelsEditorFormProps) {
  const labels = getEffectiveApproveWaveTabLabels(display);
  const useDefaultsDisabled =
    display.approvalsTabLabel.length === 0 &&
    display.approvedTabLabel.length === 0;
  const inputClasses = `tw-min-w-0 tw-rounded-md tw-border tw-border-solid tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-outline-none ${
    errorMessage
      ? "tw-border-error focus:tw-border-error"
      : "tw-border-iron-700 focus:tw-border-primary-400"
  }`;

  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <label className="tw-flex tw-flex-col tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-100">
        <span>Approvals tab label</span>
        <input
          aria-label="Approvals tab label"
          autoComplete="off"
          autoFocus
          className={inputClasses}
          disabled={disabled}
          maxLength={APPROVE_WAVE_TAB_LABEL_MAX_LENGTH}
          placeholder={DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals}
          type="text"
          value={display.approvalsTabLabel}
          onChange={(event) =>
            onDisplayChange({
              ...display,
              approvalsTabLabel: event.target.value,
            })
          }
        />
      </label>

      <label className="tw-flex tw-flex-col tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-100">
        <span>Approved tab label</span>
        <input
          aria-label="Approved tab label"
          autoComplete="off"
          className={inputClasses}
          disabled={disabled}
          maxLength={APPROVE_WAVE_TAB_LABEL_MAX_LENGTH}
          placeholder={DEFAULT_APPROVE_WAVE_TAB_LABELS.approved}
          type="text"
          value={display.approvedTabLabel}
          onChange={(event) =>
            onDisplayChange({
              ...display,
              approvedTabLabel: event.target.value,
            })
          }
        />
      </label>

      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-iron-400">
        <span className="tw-rounded-md tw-bg-iron-900 tw-px-2 tw-py-1">
          Chat
        </span>
        <span className="tw-rounded-md tw-bg-iron-800 tw-px-2 tw-py-1 tw-text-iron-200">
          {labels.approvals}
        </span>
        <span className="tw-rounded-md tw-bg-iron-800 tw-px-2 tw-py-1 tw-text-iron-200">
          {labels.approved}
        </span>
      </div>

      {errorMessage ? (
        <p className="tw-mb-0 tw-text-xs tw-leading-5 tw-text-error">
          {errorMessage}
        </p>
      ) : null}

      <WaveSettingEditorActions
        disabled={disabled}
        onCancel={onCancel}
        secondaryAction={{
          disabled: useDefaultsDisabled,
          label: "Use defaults",
          onClick: onUseDefaults,
          variant: "neutral",
        }}
        submitDisabled={saveDisabled}
      />
    </form>
  );
}
