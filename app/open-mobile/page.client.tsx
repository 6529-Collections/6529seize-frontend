"use client";

import ClientOnly from "@/components/client-only/ClientOnly";
import { ShareMobileApp } from "@/components/header/share/HeaderShareMobileApps";
import { publicEnv } from "@/config/env";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";

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

  const printShareMobileApps = () => {
    const shareIos = <ShareMobileApp platform="ios" target="_self" />;
    const shareAndroid = <ShareMobileApp platform="android" target="_self" />;

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
      <div className="tailwind-scope tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-screen tw-text-center tw-p-4 tw-gap-10">
        <p className="tw-text-2xl tw-font-bold tw-animate-pulse">
          Opening 6529 Mobile...
        </p>
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1">
          <p className="tw-text-xl tw-font-bold">Get 6529 Mobile</p>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-4">
            {printShareMobileApps()}
          </div>
        </div>
        <button
          onClick={handleBack}
          className="tw-mt-10 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit hover:tw-text-[#9a9a9a]"
        >
          Back to 6529.io
        </button>
      </div>
    </ClientOnly>
  );
}
