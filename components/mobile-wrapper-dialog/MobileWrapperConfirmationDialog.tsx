"use client";

import type { ButtonVariant } from "@/components/utils/button/buttonStyles";
import Button from "@/components/utils/button/Button";
import MobileWrapperDialog from "./MobileWrapperDialog";

interface MobileWrapperConfirmationDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly confirmText: string;
  readonly cancelText?: string | undefined;
  readonly isConfirming?: boolean | undefined;
  readonly confirmDisabled?: boolean | undefined;
  readonly confirmVariant?: ButtonVariant | undefined;
}

export default function MobileWrapperConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  isConfirming = false,
  confirmDisabled = false,
  confirmVariant = "primary",
}: MobileWrapperConfirmationDialogProps) {
  return (
    <MobileWrapperDialog
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-lg"
    >
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {message}
        </p>

        <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-justify-end sm:tw-gap-3">
          <Button
            variant="secondary"
            size="md"
            disabled={isConfirming}
            onClick={onClose}
            fullWidth
            className="sm:tw-w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            size="md"
            disabled={confirmDisabled || isConfirming}
            loading={isConfirming}
            onClick={onConfirm}
            fullWidth
            hideChildrenWhenLoading
            className="sm:tw-w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
