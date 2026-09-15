"use client";

import ClientOnly from "@/components/client-only/ClientOnly";
import { MobileAppDownload } from "@/components/apps/MobileAppDownloads";
import { getMobileDestination } from "@/helpers/mobileAppDestination";
import {
  getMobilePlatform,
  isMobileAppDestination,
} from "@/helpers/mobileAppLinks";
import { useOpenMobileApp } from "@/hooks/useOpenMobileApp";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { Capacitor } from "@capacitor/core";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function OpenMobileContent({
  pathParam,
}: {
  readonly pathParam: string | null;
}) {
  const router = useRouter();
  const parsed = getMobileDestination(pathParam, window.location.origin);
  const destination = parsed && isMobileAppDestination(parsed) ? parsed : "/";
  const hasDestination = parsed !== null && isMobileAppDestination(parsed);
  const platform = getMobilePlatform(
    navigator.userAgent,
    navigator.maxTouchPoints
  );
  const { attempted, openApp } = useOpenMobileApp();

  const handleOpen = () => {
    if (Capacitor.isNativePlatform()) {
      router.replace(destination);
      return;
    }
    // This is already the browser fallback: retry directly, never loop via an intent fallback.
    openApp(destination, false);
  };

  return (
    <div className="tailwind-scope tw-mx-auto tw-flex tw-min-h-[70svh] tw-max-w-lg tw-flex-col tw-items-center tw-justify-center tw-gap-6 tw-px-5 tw-py-10 tw-text-center">
      <Image src="/6529bgwhite.svg" alt="" width={64} height={64} unoptimized />
      <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
        {t(DEFAULT_LOCALE, "apps.openMobile.title")}
      </h1>
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          hasDestination
            ? "apps.openMobile.description"
            : "apps.openMobile.homeFallback"
        )}
      </p>
      <button
        type="button"
        onClick={handleOpen}
        className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-50 tw-px-5 tw-py-3 tw-font-semibold tw-text-iron-950 hover:tw-bg-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(DEFAULT_LOCALE, "apps.openMobile.open")}
      </button>
      {attempted && (
        <output className="tw-m-0 tw-block tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "apps.openMobile.help")}
        </output>
      )}
      <section
        aria-label={t(DEFAULT_LOCALE, "apps.openMobile.download")}
        className="tw-w-full"
      >
        <h2 className="tw-mb-3 tw-text-base tw-font-semibold tw-text-iron-50">
          {t(DEFAULT_LOCALE, "apps.openMobile.download")}
        </h2>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-4">
          {platform !== "Android" && (
            <MobileAppDownload platform="iOS" target="_self" />
          )}
          {platform !== "iOS" && (
            <MobileAppDownload platform="Android" target="_self" />
          )}
        </div>
      </section>
      <a
        href={destination}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-px-3 tw-text-sm tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(DEFAULT_LOCALE, "apps.openMobile.continue")}
      </a>
    </div>
  );
}

export default function OpenMobilePage() {
  const pathParam = useSearchParams().get("path");
  return (
    <ClientOnly>
      <OpenMobileContent key={pathParam} pathParam={pathParam} />
    </ClientOnly>
  );
}
