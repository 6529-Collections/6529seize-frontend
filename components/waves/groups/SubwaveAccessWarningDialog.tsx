"use client";

import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function SubwaveAccessWarningDialog({
  isOpen,
  onDecision,
}: {
  readonly isOpen: boolean;
  readonly onDecision: (confirmed: boolean) => void;
}) {
  const locale = useBrowserLocale();
  if (!isOpen) {
    return null;
  }
  return (
    <MobileWrapperConfirmationDialog
      isOpen={isOpen}
      title={t(locale, "waves.subwaves.accessWarning.title")}
      message={t(locale, "waves.subwaves.accessWarning.message")}
      confirmText={t(locale, "waves.subwaves.accessWarning.continue")}
      cancelText={t(locale, "waves.subwaves.accessWarning.back")}
      onClose={() => onDecision(false)}
      onConfirm={() => onDecision(true)}
      zIndexClassName="tw-z-[10000]"
    />
  );
}
