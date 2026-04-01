"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";

interface CreateDropIdentityPickerModalProps {
  readonly isOpen: boolean;
  readonly mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  readonly selectedIdentity: SelectableIdentityOption | null;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly canClose: boolean;
  readonly onClose: () => void;
  readonly onSelect: (selection: SelectableIdentityOption) => void;
}

const getHelperText = (
  mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted
) => {
  switch (mode) {
    case ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers:
      return "Search for someone else to nominate.";
    case ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone:
      return "Search for the identity you want to nominate.";
    case ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself:
      return "Your identity will be used automatically.";
  }
};

export default function CreateDropIdentityPickerModal({
  isOpen,
  mode,
  selectedIdentity,
  disabled,
  errorMessage,
  canClose,
  onClose,
  onSelect,
}: CreateDropIdentityPickerModalProps) {
  return (
    <MobileWrapperDialog
      title="Select identity"
      isOpen={isOpen}
      onClose={onClose}
      dismissible={canClose}
      tabletModal
      allowOverflow
      maxWidthClass="md:tw-max-w-xl"
    >
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-mb-6 tw-text-sm tw-font-normal tw-text-iron-400">
          {getHelperText(mode)}
        </p>

        <IdentitySearch
          identity={selectedIdentity?.value ?? null}
          selectedDisplayValue={selectedIdentity?.label ?? null}
          setIdentity={() => {}}
          onSelectionChange={(selection) => {
            if (selection) {
              onSelect(selection);
            }
          }}
          label="Search identity"
          size={IdentitySearchSize.MD}
          autoFocus
          clearable={false}
          dropdownListClassName="tw-max-h-[50vh] md:tw-max-h-96 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
          error={!!errorMessage}
          errorMessage={errorMessage}
        />

        {disabled && (
          <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-font-medium tw-text-iron-500">
            Identity selection is disabled while the drop is submitting.
          </p>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
