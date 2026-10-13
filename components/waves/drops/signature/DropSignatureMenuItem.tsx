"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { FingerPrintIcon } from "@heroicons/react/24/outline";

interface DropSignatureMenuButtonProps {
  readonly onSelect: () => void;
  readonly mobile?: boolean | undefined;
}

interface DropSignatureMenuItemProps extends DropSignatureMenuButtonProps {
  readonly dropId: string;
}

function DropSignatureMenuButton({
  onSelect,
  mobile = false,
}: DropSignatureMenuButtonProps) {
  const locale = useBrowserLocale();
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={
        mobile
          ? "tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
          : "tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
      }
    >
      <FingerPrintIcon
        aria-hidden="true"
        className={
          mobile
            ? "tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
            : "tw-size-4 tw-flex-shrink-0"
        }
      />
      <span
        className={
          mobile
            ? "tw-text-base tw-font-semibold tw-text-iron-300"
            : "tw-text-sm tw-font-medium"
        }
      >
        {t(locale, "signedMessages.signature.menuItem")}
      </span>
    </button>
  );
}

/** "Signature" drop menu item; hidden while signed messages are disabled. */
export default function DropSignatureMenuItem({
  dropId,
  onSelect,
  mobile,
}: DropSignatureMenuItemProps) {
  if (!isSignedMessagesEnabled() || dropId.startsWith("temp-")) {
    return null;
  }
  return <DropSignatureMenuButton onSelect={onSelect} mobile={mobile} />;
}
