"use client";

import { useEffect } from "react";

import {
  getErrorBoundaryRetry,
  type ErrorBoundaryRetryProps,
} from "@/components/error/errorBoundaryRetry";
import { ProfileCmsState } from "@/components/profile-cms/CmsSiteStates";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function ProfileCmsRouteError({
  error,
  ...retryProps
}: ErrorBoundaryRetryProps & {
  readonly error: Error & { digest?: string | undefined };
}) {
  const retry = getErrorBoundaryRetry(retryProps);
  useEffect(() => {
    console.error(error);
  }, [error]);

  const locale = DEFAULT_LOCALE;

  return (
    <ProfileCmsState
      locale={locale}
      title={t(locale, "profileCms.error.title")}
      action={
        <button
          className="tw-min-h-11 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-primary-500/20"
          type="button"
          onClick={() => retry()}
        >
          {t(locale, "profileCms.error.retry")}
        </button>
      }
    >
      <p>{t(locale, "profileCms.error.description")}</p>
    </ProfileCmsState>
  );
}
