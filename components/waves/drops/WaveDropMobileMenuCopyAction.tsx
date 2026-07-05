"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { MessageKey } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

interface WaveDropMobileMenuCopyActionProps {
  readonly labelKey: MessageKey;
  readonly icon: ReactNode;
  readonly disabled: boolean;
  readonly getText: () => string;
  readonly onCopy: () => void;
}

export default function WaveDropMobileMenuCopyAction({
  labelKey,
  icon,
  disabled,
  getText,
  onCopy,
}: WaveDropMobileMenuCopyActionProps) {
  const [copied, setCopied] = useState(false);
  const copiedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMountedRef = useRef(true);
  const locale = useBrowserLocale();

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (copiedResetTimeoutRef.current !== null) {
        globalThis.clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (disabled) {
      return;
    }

    const clipboard = globalThis.navigator?.clipboard as
      | { writeText?: (text: string) => Promise<void> }
      | undefined;

    if (typeof clipboard?.writeText !== "function") {
      onCopy();
      return;
    }

    void clipboard
      .writeText(getText())
      .then(() => {
        if (!isMountedRef.current) {
          return;
        }

        setCopied(true);
        onCopy();
        if (copiedResetTimeoutRef.current !== null) {
          globalThis.clearTimeout(copiedResetTimeoutRef.current);
        }
        copiedResetTimeoutRef.current = globalThis.setTimeout(() => {
          if (isMountedRef.current) {
            setCopied(false);
            copiedResetTimeoutRef.current = null;
          }
        }, 2000);
      })
      .catch(() => {
        onCopy();
      });
  };

  return (
    <button
      type="button"
      className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
        disabled ? "tw-cursor-default tw-opacity-50" : "active:tw-bg-iron-800"
      } tw-transition-colors tw-duration-200`}
      onClick={copyToClipboard}
      disabled={disabled}
    >
      {icon}
      <span
        role="status"
        className={`tw-text-base tw-font-semibold ${
          copied ? "tw-text-primary-400" : "tw-text-iron-300"
        }`}
      >
        {copied
          ? t(locale, "waves.drop.actions.copied")
          : t(locale, labelKey)}
      </span>
    </button>
  );
}
