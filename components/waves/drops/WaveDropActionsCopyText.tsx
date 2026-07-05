"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { buildDropClipboardText } from "@/helpers/waves/drop-clipboard.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import React from "react";

interface WaveDropActionsCopyTextProps {
  readonly drop: ApiDrop;
  readonly onCopy?: (() => void) | undefined;
}

/**
 * Desktop dropdown counterpart of the mobile long-press "Copy text" action —
 * hybrid/desktop devices don't get the touch action sheet.
 */
const WaveDropActionsCopyText: React.FC<WaveDropActionsCopyTextProps> = ({
  drop,
  onCopy,
}) => {
  const locale = useBrowserLocale();
  const isDisabled = drop.id.startsWith("temp-");

  const copyToClipboard = () => {
    if (isDisabled) {
      return;
    }

    const clipboard = globalThis.navigator?.clipboard as
      | { writeText?: (text: string) => Promise<void> }
      | undefined;

    // Close the menu even when the clipboard API is unavailable or the write
    // fails — mirrors the mobile copy action's behavior.
    if (typeof clipboard?.writeText !== "function") {
      onCopy?.();
      return;
    }

    void clipboard
      .writeText(buildDropClipboardText(drop))
      .then(() => {
        onCopy?.();
      })
      .catch(() => {
        onCopy?.();
      });
  };

  return (
    <button
      onClick={copyToClipboard}
      disabled={isDisabled}
      className={`tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-transition-colors tw-duration-200 ${
        isDisabled
          ? "tw-cursor-default tw-text-iron-500 tw-opacity-50"
          : "tw-cursor-pointer tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800"
      }`}
    >
      <svg
        className="tw-h-4 tw-w-4 tw-flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
        />
      </svg>
      <span className="tw-text-sm tw-font-medium">
        {t(locale, "waves.drop.actions.copyText")}
      </span>
    </button>
  );
};

export default WaveDropActionsCopyText;
