"use client";

import type { DropClipboardCopyStatus } from "@/hooks/drops/useDropClipboardCopyFeedback";
import { useDropClipboardCopyFeedback } from "@/hooks/drops/useDropClipboardCopyFeedback";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { MessageKey } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import type { MouseEvent, ReactNode } from "react";

interface WaveDropMobileMenuCopyActionProps {
  readonly labelKey: MessageKey;
  readonly icon: ReactNode;
  readonly disabled: boolean;
  readonly getText: () => string;
  readonly onCopy: () => void;
}

const STATUS_LABEL_CLASSES: Record<DropClipboardCopyStatus, string> = {
  idle: "tw-text-iron-300",
  copied: "tw-text-primary-400",
  failed: "tw-text-red",
};

export default function WaveDropMobileMenuCopyAction({
  labelKey,
  icon,
  disabled,
  getText,
  onCopy,
}: WaveDropMobileMenuCopyActionProps) {
  const locale = useBrowserLocale();
  const { status, statusMessage, copyToClipboard } =
    useDropClipboardCopyFeedback();

  const handleCopyClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (disabled) {
      return;
    }

    // On failure the action sheet stays open (onCopy is not invoked) so the
    // user sees the failure instead of a silent close that looks like success.
    copyToClipboard(getText, onCopy);
  };

  return (
    <button
      type="button"
      className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
        disabled ? "tw-cursor-default tw-opacity-50" : "active:tw-bg-iron-800"
      } tw-transition-colors tw-duration-200`}
      onClick={handleCopyClick}
      disabled={disabled}
    >
      {icon}
      <span
        className={`tw-text-base tw-font-semibold ${STATUS_LABEL_CLASSES[status]}`}
      >
        {statusMessage || t(locale, labelKey)}
      </span>
      {/* role="status" must live outside the label: Chromium drops live-region
          content from the button's name-from-contents computation */}
      <span role="status" className="tw-sr-only">
        {statusMessage}
      </span>
    </button>
  );
}
