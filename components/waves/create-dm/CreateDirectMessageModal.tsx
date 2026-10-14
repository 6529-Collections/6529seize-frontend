"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiIdentity } from "../../../generated/models/ApiIdentity";
import CreateDirectMessage from "./CreateDirectMessage";

interface CreateDirectMessageModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly profile: ApiIdentity;
}

export default function CreateDirectMessageModal({
  isOpen,
  onClose,
  onSuccess,
  profile,
}: CreateDirectMessageModalProps) {
  const locale = useBrowserLocale();

  return (
    <MobileWrapperDialog
      title={t(locale, "quickDm.createModalTitle")}
      closeLabel={t(locale, "quickDm.createModalCloseAriaLabel")}
      isOpen={isOpen}
      onClose={onClose}
      noPadding
      tall
      tabletModal
      focusTitleOnOpen
      maxWidthClass="md:tw-max-w-[500px]"
      zIndexClassName="tw-z-[9999]"
      headerClassName="tw-flex-shrink-0 tw-py-4"
      headerCloseButtonClassName="tw-size-11"
      titleClassName="tw-font-bold"
      surfaceClassName="tw-bg-black md:!tw-max-h-[min(680px,calc(100svh-4rem))]"
    >
      <CreateDirectMessage
        presentation="modal"
        profile={profile}
        onBack={onClose}
        onSuccess={onSuccess ?? onClose}
      />
    </MobileWrapperDialog>
  );
}
