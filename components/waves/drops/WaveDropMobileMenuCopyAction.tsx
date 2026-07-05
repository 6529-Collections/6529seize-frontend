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

type CopyStatus = "idle" | "copied" | "failed";

const STATUS_LABEL_CLASSES: Record<CopyStatus, string> = {
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
  const [status, setStatus] = useState<CopyStatus>("idle");
  const statusResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMountedRef = useRef(true);
  const locale = useBrowserLocale();

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (statusResetTimeoutRef.current !== null) {
        globalThis.clearTimeout(statusResetTimeoutRef.current);
      }
    };
  }, []);

  const showTransientStatus = (nextStatus: CopyStatus) => {
    setStatus(nextStatus);
    if (statusResetTimeoutRef.current !== null) {
      globalThis.clearTimeout(statusResetTimeoutRef.current);
    }
    statusResetTimeoutRef.current = globalThis.setTimeout(() => {
      if (isMountedRef.current) {
        setStatus("idle");
        statusResetTimeoutRef.current = null;
      }
    }, 2000);
  };

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (disabled) {
      return;
    }

    const clipboard = globalThis.navigator?.clipboard as
      | { writeText?: (text: string) => Promise<void> }
      | undefined;

    if (typeof clipboard?.writeText !== "function") {
      // Keep the menu open so the user sees the failure and can retry.
      showTransientStatus("failed");
      return;
    }

    void clipboard
      .writeText(getText())
      .then(() => {
        if (!isMountedRef.current) {
          return;
        }

        showTransientStatus("copied");
        onCopy();
      })
      .catch(() => {
        if (isMountedRef.current) {
          showTransientStatus("failed");
        }
      });
  };

  let statusMessage = "";
  if (status === "copied") {
    statusMessage = t(locale, "waves.drop.actions.copied");
  } else if (status === "failed") {
    statusMessage = t(locale, "waves.drop.actions.copyFailed");
  }

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
