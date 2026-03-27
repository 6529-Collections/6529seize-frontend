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
  onClose,
  onSelect,
}: CreateDropIdentityPickerModalProps) {
  return (
    <MobileWrapperDialog
      title="Select identity"
      isOpen={isOpen}
      onClose={onClose}
      tall
      fixedHeight
      tabletModal
      maxWidthClass="md:tw-max-w-xl"
      showScrollbar
    >
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-mb-4 tw-text-sm tw-font-medium tw-text-iron-300">
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
          error={!!errorMessage}
          errorMessage={errorMessage}
        />

        <p className="tw-mb-0 tw-mt-4 tw-text-xs tw-font-medium tw-text-iron-500">
          If no identity is selected, closing this picker will leave Drop mode.
        </p>

        {disabled && (
          <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-font-medium tw-text-iron-500">
            Identity selection is disabled while the drop is submitting.
          </p>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
