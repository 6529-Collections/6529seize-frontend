"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { SelectableIdentityOption } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import CreateDropIdentityPickerContent from "./CreateDropIdentityPickerContent";

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
        <CreateDropIdentityPickerContent
          mode={mode}
          selectedIdentity={selectedIdentity}
          disabled={disabled}
          errorMessage={errorMessage}
          onSelect={onSelect}
        />
      </div>
    </MobileWrapperDialog>
  );
}
