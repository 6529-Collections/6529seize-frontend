"use client";

import { Capacitor } from "@capacitor/core";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import {
  getMobilePlatform,
  isMobileAppDestination,
} from "@/helpers/mobileAppLinks";
import {
  dismissMobileAppBanner,
  useMobileAppBannerDismissal,
} from "@/hooks/useMobileAppBannerDismissal";
import { useOpenMobileApp } from "@/hooks/useOpenMobileApp";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function MobileAppBanner() {
  const pathname = usePathname();
  const dismissed = useMobileAppBannerDismissal();
  const { attempted, openApp } = useOpenMobileApp();
  const platform =
    typeof navigator === "undefined"
      ? null
      : getMobilePlatform(navigator.userAgent, navigator.maxTouchPoints);

  if (
    dismissed ||
    !platform ||
    Capacitor.isNativePlatform() ||
    !isMobileAppDestination(pathname)
  )
    return null;

  return (
    <aside
      aria-label={t(DEFAULT_LOCALE, "apps.banner.label")}
      className="tailwind-scope tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      <div className="tw-flex tw-min-h-16 tw-items-center tw-gap-3 tw-px-4 tw-py-2">
        <Image
          src="/6529bgwhite.svg"
          alt=""
          width={36}
          height={36}
          unoptimized
          className="tw-size-9 tw-shrink-0"
        />
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
            {t(DEFAULT_LOCALE, "apps.mobile.title")}
          </p>
          <a
            href={platform === "iOS" ? MOBILE_APP_IOS : MOBILE_APP_ANDROID}
            className="tw-inline-flex tw-min-h-6 tw-items-center tw-text-xs tw-leading-4 tw-text-iron-300 tw-underline tw-underline-offset-2 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(DEFAULT_LOCALE, "apps.banner.get")}
          </a>
        </div>
        <button
          type="button"
          onClick={() => openApp()}
          aria-label={t(DEFAULT_LOCALE, "apps.banner.label")}
          className="tw-min-h-11 tw-shrink-0 tw-rounded-full tw-border-0 tw-bg-iron-50 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-950 hover:tw-bg-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(DEFAULT_LOCALE, "apps.banner.open")}
        </button>
        <button
          type="button"
          onClick={dismissMobileAppBanner}
          aria-label={t(DEFAULT_LOCALE, "apps.banner.dismiss")}
          className="-tw-mr-2 tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <XMarkIcon className="tw-size-5" aria-hidden="true" />
        </button>
      </div>
      {attempted && (
        <output className="tw-m-0 tw-block tw-px-4 tw-pb-3 tw-text-xs tw-text-iron-300">
          {t(DEFAULT_LOCALE, "apps.openMobile.help")}
        </output>
      )}
    </aside>
  );
}
