"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { createPortal } from "react-dom";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { AllMentionConfirmationState } from "./useAllMentionConfirmation";

function getDescription(
  locale: SupportedLocale,
  state: AllMentionConfirmationState
): string {
  if (state.status === "ready") {
    const key =
      state.count === 1
        ? "waves.chat.allMention.descriptionOne"
        : "waves.chat.allMention.description";
    return t(locale, key, { count: formatNumber(locale, state.count) });
  }
  const key =
    state.status === "loading"
      ? "waves.chat.allMention.loading"
      : "waves.chat.allMention.error";
  return t(locale, key);
}

export default function AllMentionConfirmationDialog({
  state,
  onCancel,
  onConfirm,
  onRetry,
}: {
  readonly state: AllMentionConfirmationState | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();
  if (!state || typeof document === "undefined") return null;
  const ready = state.status === "ready";
  return createPortal(
    <Dialog
      open
      onClose={onCancel}
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000001]"
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-600/60 tw-backdrop-blur-[1px]" />
      <div className="tw-fixed tw-left-0 tw-top-0 tw-flex tw-h-dvh tw-w-screen tw-items-center tw-justify-center tw-overflow-y-auto tw-p-4">
        <DialogPanel className="tw-max-h-full tw-w-full tw-min-w-0 tw-max-w-md tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-5 tw-shadow-2xl sm:tw-p-6">
          <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
            {t(locale, "waves.chat.allMention.title")}
          </DialogTitle>
          <Description
            aria-live="polite"
            className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-200"
          >
            {getDescription(locale, state)}
          </Description>
          {ready && (
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "waves.chat.allMention.snapshot")}
            </p>
          )}
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-justify-end tw-gap-3">
            <Button data-autofocus variant="secondary" onClick={onCancel}>
              {t(locale, "waves.chat.allMention.cancel")}
            </Button>
            {state.status === "error" ? (
              <Button variant="primary" onClick={onRetry}>
                {t(locale, "waves.chat.allMention.retry")}
              </Button>
            ) : (
              <Button variant="primary" disabled={!ready} onClick={onConfirm}>
                {t(locale, "waves.chat.allMention.confirm")}
              </Button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>,
    document.body
  );
}
