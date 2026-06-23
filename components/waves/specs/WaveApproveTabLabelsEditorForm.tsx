import {
  APPROVE_WAVE_TAB_LABEL_MAX_LENGTH,
  DEFAULT_APPROVE_WAVE_TAB_LABELS,
  getEffectiveApproveWaveTabLabels,
} from "@/helpers/waves/wave-metadata.helpers";
import type { CreateWaveApproveDisplayConfig } from "@/types/waves.types";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

type ApproveTabLabelField = "approvals" | "approved";

interface WaveApproveTabLabelsEditorFormProps {
  readonly disabled: boolean;
  readonly display: CreateWaveApproveDisplayConfig;
  readonly errorMessage: string | null;
  readonly field: ApproveTabLabelField;
  readonly onCancel: () => void;
  readonly onDisplayChange: (display: CreateWaveApproveDisplayConfig) => void;
  readonly onSave: () => void;
  readonly onUseDefault: () => void;
  readonly saveDisabled: boolean;
}

const FIELD_CONFIG: Record<
  ApproveTabLabelField,
  {
    readonly ariaLabel: string;
    readonly draftKey: keyof CreateWaveApproveDisplayConfig;
    readonly label: string;
    readonly placeholder: string;
  }
> = {
  approvals: {
    ariaLabel: "Approvals tab label",
    draftKey: "approvalsTabLabel",
    label: "Approvals tab label",
    placeholder: DEFAULT_APPROVE_WAVE_TAB_LABELS.approvals,
  },
  approved: {
    ariaLabel: "Approved tab label",
    draftKey: "approvedTabLabel",
    label: "Approved tab label",
    placeholder: DEFAULT_APPROVE_WAVE_TAB_LABELS.approved,
  },
};

export default function WaveApproveTabLabelsEditorForm({
  disabled,
  display,
  errorMessage,
  field,
  onCancel,
  onDisplayChange,
  onSave,
  onUseDefault,
  saveDisabled,
}: WaveApproveTabLabelsEditorFormProps) {
  const labels = getEffectiveApproveWaveTabLabels(display);
  const fieldConfig = FIELD_CONFIG[field];
  const value = display[fieldConfig.draftKey];
  const useDefaultDisabled = value.length === 0;
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
        <span>{fieldConfig.label}</span>
        <input
          aria-label={fieldConfig.ariaLabel}
          autoComplete="off"
          autoFocus
          className={inputClasses}
          disabled={disabled}
          maxLength={APPROVE_WAVE_TAB_LABEL_MAX_LENGTH}
          placeholder={fieldConfig.placeholder}
          type="text"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            onDisplayChange(
              field === "approvals"
                ? { ...display, approvalsTabLabel: nextValue }
                : { ...display, approvedTabLabel: nextValue }
            );
          }}
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
          disabled: useDefaultDisabled,
          label: "Use default",
          onClick: onUseDefault,
          variant: "neutral",
        }}
        submitDisabled={saveDisabled}
      />
    </form>
  );
}

export type { ApproveTabLabelField };
