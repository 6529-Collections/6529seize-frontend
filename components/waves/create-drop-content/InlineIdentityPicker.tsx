import type { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CreateDropIdentityPickerContent from "../CreateDropIdentityPickerContent";

export default function InlineIdentityPicker({
  mode,
  selectedIdentity,
  disabled,
  errorMessage,
  canClose,
  onClose,
  onSelect,
}: {
  readonly mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  readonly selectedIdentity: SelectableIdentityOption | null;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly canClose: boolean;
  readonly onClose: () => void;
  readonly onSelect: (selection: SelectableIdentityOption) => void;
}) {
  return (
    <div
      className="tw-mb-3 tw-rounded-2xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/80 tw-p-4 tw-shadow-lg"
      data-testid="identity-picker-inline"
    >
      <div className="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-4">
        <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-tracking-tight tw-text-iron-50">
          Select identity
        </h3>
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-white/5 tw-p-0 tw-text-iron-400 tw-transition-colors disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white"
            aria-label="Close identity picker"
            title="Close identity picker"
          >
            <XMarkIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <CreateDropIdentityPickerContent
        mode={mode}
        selectedIdentity={selectedIdentity}
        disabled={disabled}
        errorMessage={errorMessage}
        onSelect={onSelect}
      />
    </div>
  );
}
