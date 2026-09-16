"use client";

import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { publicEnv } from "@/config/env";
import { getNativeLinkDestination } from "@/helpers/mobileAppLinks";
import useCapacitor from "./useCapacitor";

export { DeepLinkScope } from "@/helpers/mobileAppLinks";

export const useDeepLinkNavigation = () => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitor) return;
    let disposed = false;
    let receivedEvent = false;
    let initialUrl: string | undefined;
    let initialUrlReceivedAt = 0;

    const navigate = (url: string) => {
      if (disposed) return;
      const destination = getNativeLinkDestination(
        url,
        publicEnv.MOBILE_APP_SCHEME ?? "mobile6529",
        window.location.origin,
        Math.floor(Date.now() / 1000)
      );
      if (destination) router.push(destination);
    };

    const listener = App.addListener("appUrlOpen", ({ url }) => {
      receivedEvent = true;
      // Some native shells deliver the launch URL through both APIs.
      if (url === initialUrl && Date.now() - initialUrlReceivedAt < 1000)
        return;
      navigate(url);
    });

    void App.getLaunchUrl()
      .then((launch) => {
        if (disposed || receivedEvent || !launch?.url) return;
        initialUrl = launch.url;
        initialUrlReceivedAt = Date.now();
        navigate(launch.url);
      })
      .catch(() => {
        // The foreground listener remains usable if launch URL retrieval is unavailable.
      });

    return () => {
      disposed = true;
      void listener.then((handle) => handle.remove());
    };
  }, [isCapacitor, router]);
};
