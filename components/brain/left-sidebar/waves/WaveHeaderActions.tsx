"use client";

import Link from "next/link";
import { faCompass } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export const WAVE_HEADER_ACTION_CLASSES =
  "tw-inline-flex tw-cursor-pointer tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-p-0 tw-no-underline tw-transition-colors desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-primary-300 active:tw-bg-iron-800 focus-visible:tw-text-primary-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 touch-only:tw-size-11 motion-reduce:tw-transition-none";

export function DiscoverWavesLink() {
  const locale = useBrowserLocale();
  const label = t(locale, "navigation.waves.discover");
  return (
    <Link
      href="/discover"
      aria-label={label}
      data-tooltip-id="discover-waves-tooltip"
      data-tooltip-content={label}
      className={`${WAVE_HEADER_ACTION_CLASSES} tw-text-iron-300`}
    >
      <FontAwesomeIcon
        icon={faCompass}
        className="tw-size-4"
        aria-hidden="true"
      />
    </Link>
  );
}
