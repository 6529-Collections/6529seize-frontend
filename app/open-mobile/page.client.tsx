"use client";

import ClientOnly from "@/components/client-only/ClientOnly";
import { MobileAppDownload } from "@/components/apps/MobileAppDownloads";
import { publicEnv } from "@/config/env";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";

const APPS_LOCALE = DEFAULT_LOCALE;

export default function OpenMobilePage() {
  const searchParams = useSearchParams();
  const pathParam = searchParams?.get("path") || "";
  const [decodedPath, setDecodedPath] = useState<string | null>(null);
  const { isAppleMobile } = useDeviceInfo();

  useEffect(() => {
    if (typeof window === "undefined" || !pathParam) {
      return;
    }

    const appScheme = publicEnv.MOBILE_APP_SCHEME ?? "mobile6529";
    const decoded = decodeURIComponent(pathParam);
    const deepLink = `${appScheme}://${DeepLinkScope.NAVIGATE}${decoded}`;

    setDecodedPath(decoded);
    window.open(deepLink, "_self");
  }, [pathParam]);

  const handleBack = () => {
    if (decodedPath) {
      window.open(`${window.location.origin}${decodedPath}`, "_self");
    } else {
      window.open(window.location.origin, "_self");
    }
  };

  const printMobileApps = () => {
    const shareIos = <MobileAppDownload platform="iOS" target="_self" />;
    const shareAndroid = (
      <MobileAppDownload platform="Android" target="_self" />
    );

    const userAgent =
      typeof navigator === "undefined" ? "" : navigator.userAgent;
    const isAndroid = /android/i.test(userAgent);

    if (isAppleMobile) {
      return shareIos;
    } else if (isAndroid) {
      return shareAndroid;
    }

    return (
      <>
        {shareIos}
        {shareAndroid}
      </>
    );
  };

  return (
    <ClientOnly>
      <div className="tailwind-scope tw-flex tw-h-screen tw-flex-col tw-items-center tw-justify-center tw-gap-10 tw-p-4 tw-text-center">
        <p className="tw-animate-pulse tw-text-2xl tw-font-bold">
          {t(APPS_LOCALE, "apps.openMobile.opening")}
        </p>
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1">
          <p className="tw-text-xl tw-font-bold">
            {t(APPS_LOCALE, "apps.openMobile.get")}
          </p>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-4">
            {printMobileApps()}
          </div>
        </div>
        <button
          onClick={handleBack}
          className="tw-mt-10 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit hover:tw-text-[#9a9a9a]"
        >
          {t(APPS_LOCALE, "apps.openMobile.back")}
        </button>
      </div>
    </ClientOnly>
  );
}
