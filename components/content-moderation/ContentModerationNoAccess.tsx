"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ContentModerationNoAccess({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-py-12 tw-text-center">
      <LockClosedIcon
        className="tw-size-24 tw-flex-shrink-0 tw-text-iron-500"
        aria-hidden="true"
      />
      <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-200">
        {t(locale, "contentModeration.moderator.accessRequirement")}
      </h2>
      <p className="tw-m-0 tw-max-w-xl tw-text-base tw-leading-7 tw-text-iron-300">
        {t(locale, "contentModeration.moderator.accessRecovery")}
      </p>
      <Link
        href="/"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(locale, "contentModeration.moderator.goHome")}
      </Link>
    </div>
  );
}
