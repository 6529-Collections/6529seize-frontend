"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function ContentModerationAccessError({
  locale,
  retrying,
  onRetryAction,
}: {
  readonly locale: SupportedLocale;
  readonly retrying: boolean;
  readonly onRetryAction: () => void;
}) {
  return (
    <div className="tw-mt-8 tw-flex tw-flex-col tw-items-start tw-gap-3">
      <p role="alert" className="tw-m-0 tw-text-sm tw-text-red">
        {t(locale, "contentModeration.moderator.accessError")}
      </p>
      <button
        type="button"
        disabled={retrying}
        aria-busy={retrying}
        onClick={onRetryAction}
        className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50"
      >
        {t(locale, "contentModeration.moderator.retryAccess")}
      </button>
      {retrying && (
        <output className="tw-text-sm tw-text-iron-300">
          {t(locale, "contentModeration.moderator.checkingPermissions")}
        </output>
      )}
    </div>
  );
}
