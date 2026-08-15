import Button from "@/components/utils/button/Button";
import type { MentionAlias } from "@/entities/IMentionAlias";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { RefObject } from "react";

export function QuickTagsBackButton({
  disabled = false,
  label,
  onClick,
}: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="tw-flex tw-size-11 tw-flex-none -tw-translate-x-1 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-100 sm:tw-size-10"
    >
      <ArrowLeftIcon aria-hidden="true" className="tw-size-4" />
    </button>
  );
}

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
    <div aria-labelledby="delete-mention-shortcut-title">
      <div className="tw-flex tw-items-center tw-gap-2">
        <QuickTagsBackButton
          label={t(locale, "user.mentionShortcuts.back")}
          disabled={isPending}
          onClick={onCancel}
        />
        <h3
          ref={headingRef}
          id="delete-mention-shortcut-title"
          tabIndex={-1}
          className="tw-m-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
        >
          {t(locale, "user.mentionShortcuts.deleteTitle", {
            alias: alias.alias,
          })}
        </h3>
      </div>

      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-400">
        {t(locale, "user.mentionShortcuts.deleteWarning")}
      </p>
      <p aria-live="polite" className="tw-sr-only">
        {isPending ? t(locale, "user.mentionShortcuts.deleting") : ""}
      </p>
      <div className="tw-mt-5 tw-flex tw-flex-col-reverse tw-gap-2 sm:tw-flex-row sm:tw-justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={onCancel}
        >
          {t(locale, "user.mentionShortcuts.cancel")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          loading={isPending}
          onClick={onConfirm}
        >
          {t(locale, "user.mentionShortcuts.delete")}
        </Button>
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
    <div role="alert" className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-error">
        {t(locale, "user.mentionShortcuts.loadError")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/10 sm:tw-min-h-9"
      >
        {t(locale, "user.mentionShortcuts.retry")}
      </button>
    </div>
  );
}
