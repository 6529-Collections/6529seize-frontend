"use client";

import Link from "next/link";
import { faCompass } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function DiscoverWavesLink() {
  const locale = useBrowserLocale();
  return (
    <Link
      href="/discover"
      className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-6 tw-shrink-0 tw-items-center tw-gap-2 tw-rounded-md tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 touch-only:tw-min-h-11 lg:tw-min-h-8 touch-only:lg:tw-min-h-11"
    >
      {t(locale, "navigation.waves.discover")}
      <FontAwesomeIcon
        icon={faCompass}
        className="tw-size-4"
        aria-hidden="true"
      />
    </Link>
  );
}
