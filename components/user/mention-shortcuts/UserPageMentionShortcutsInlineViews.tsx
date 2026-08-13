import type { MentionAlias } from "@/entities/IMentionAlias";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { RefObject } from "react";

export function QuickTagsDeleteConfirmation({
  alias,
  headingRef,
  isPending,
  onCancel,
  onConfirm,
}: {
  readonly alias: MentionAlias;
  readonly headingRef: RefObject<HTMLHeadingElement | null>;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const locale = useBrowserLocale();

  return (
    <div
      aria-labelledby="delete-mention-shortcut-title"
      className="tw-p-1 sm:tw-p-2"
    >
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          aria-label={t(locale, "user.mentionShortcuts.backToList")}
          onClick={onCancel}
          className="tw-flex tw-size-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-100"
        >
          <ArrowLeftIcon aria-hidden="true" className="tw-size-4" />
        </button>
        <h3
          ref={headingRef}
          id="delete-mention-shortcut-title"
          tabIndex={-1}
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-white focus:tw-outline-none"
        >
          {t(locale, "user.mentionShortcuts.deleteTitle", {
            alias: alias.alias,
          })}
        </h3>
      </div>

      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400">
        {t(locale, "user.mentionShortcuts.deleteWarning")}
      </p>
      <p aria-live="polite" className="tw-sr-only">
        {isPending ? t(locale, "user.mentionShortcuts.deleting") : ""}
      </p>
      <div className="tw-mt-6 tw-flex tw-flex-col-reverse tw-gap-2 sm:tw-flex-row sm:tw-justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-white"
        >
          {t(locale, "user.mentionShortcuts.cancel")}
        </button>
        <button
          type="button"
          disabled={isPending}
          aria-busy={isPending}
          onClick={onConfirm}
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-red/40 tw-bg-red/10 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-red tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-red/15"
        >
          {t(locale, "user.mentionShortcuts.delete")}
        </button>
      </div>
    </div>
  );
}

export function QuickTagsLoadError({
  onRetry,
}: {
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();

  return (
    <div role="alert" className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-error">
        {t(locale, "user.mentionShortcuts.loadError")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/10"
      >
        {t(locale, "user.mentionShortcuts.retry")}
      </button>
    </div>
  );
}
