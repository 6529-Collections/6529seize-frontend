"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useEffect, useRef, useState } from "react";

export type DropClipboardCopyStatus = "idle" | "copied" | "failed";

const STATUS_RESET_DELAY_MS = 2000;

interface UseDropClipboardCopyFeedbackResult {
  readonly status: DropClipboardCopyStatus;
  readonly statusMessage: string;
  readonly copyToClipboard: (
    getText: () => string,
    onCopied?: (() => void) | undefined
  ) => void;
}

/**
 * Shared copy-to-clipboard state machine for drop copy actions (mobile action
 * sheet and desktop dropdown). Shows a transient "Copied!"/"Copy failed"
 * status for 2s, and only invokes onCopied after a confirmed clipboard write —
 * a missing clipboard API or a rejected write surfaces as "failed" instead of
 * pretending success.
 */
export function useDropClipboardCopyFeedback(): UseDropClipboardCopyFeedbackResult {
  const [status, setStatus] = useState<DropClipboardCopyStatus>("idle");
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

  const showTransientStatus = (nextStatus: DropClipboardCopyStatus) => {
    setStatus(nextStatus);
    if (statusResetTimeoutRef.current !== null) {
      globalThis.clearTimeout(statusResetTimeoutRef.current);
    }
    statusResetTimeoutRef.current = globalThis.setTimeout(() => {
      if (isMountedRef.current) {
        setStatus("idle");
        statusResetTimeoutRef.current = null;
      }
    }, STATUS_RESET_DELAY_MS);
  };

  const copyToClipboard = (
    getText: () => string,
    onCopied?: (() => void) | undefined
  ) => {
    const clipboard = globalThis.navigator?.clipboard as
      | { writeText?: (text: string) => Promise<void> }
      | undefined;

    if (typeof clipboard?.writeText !== "function") {
      showTransientStatus("failed");
      return;
    }

    void clipboard
      .writeText(getText())
      .then(() => {
        if (!isMountedRef.current) {
          return;
        }

        // Surface the transient "copied" state before invoking onCopied.
        // Consumers that close their surface on success (the drop dropdown /
        // action sheet) only reveal it during the close animation; it stays
        // fully visible for any consumer that keeps its surface open.
        showTransientStatus("copied");
        onCopied?.();
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

  return { status, statusMessage, copyToClipboard };
}
