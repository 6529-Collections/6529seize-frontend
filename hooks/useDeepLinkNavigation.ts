"use client";

import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { publicEnv } from "@/config/env";
import {
  getNativeLinkDestination,
  isCurrentNativeLinkLocation,
} from "@/helpers/mobileAppLinks";
import useCapacitor from "./useCapacitor";

export { DeepLinkScope } from "@/helpers/mobileAppLinks";

export const useDeepLinkNavigation = () => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();

  useEffect(() => {
    if (!isCapacitor) return;
    let disposed = false;
    let receivedEvent = false;
    let launchUrlSettled = false;
    let initialUrl: string | undefined;
    let initialUrlReceivedAt = 0;

    const navigate = (url: string, isLaunchLink: boolean) => {
      if (disposed) return;
      const { origin, href } = window.location;
      const destination = getNativeLinkDestination(
        url,
        publicEnv.MOBILE_APP_SCHEME ?? "mobile6529",
        origin,
        Math.floor(Date.now() / 1000)
      );
      if (!destination) return;
      // The native shell can open the app directly at the launch link's page.
      // Navigating again would only re-render it and scroll to the top.
      if (
        isLaunchLink &&
        isCurrentNativeLinkLocation(destination, href, origin)
      )
        return;
      router.push(destination);
    };

    const listener = App.addListener("appUrlOpen", ({ url }) => {
      receivedEvent = true;
      // Some native shells deliver the launch URL through both APIs.
      if (url === initialUrl && Date.now() - initialUrlReceivedAt < 1000)
        return;
      // iOS replays the launch link to the first listener, usually before
      // the launch URL request settles.
      navigate(url, !launchUrlSettled);
    });

    void App.getLaunchUrl()
      .then((launch) => {
        launchUrlSettled = true;
        if (disposed || receivedEvent || !launch?.url) return;
        initialUrl = launch.url;
        initialUrlReceivedAt = Date.now();
        navigate(launch.url, true);
      })
      .catch(() => {
        launchUrlSettled = true;
        // The foreground listener remains usable if launch URL retrieval is unavailable.
      });

    return () => {
      disposed = true;
      void listener.then((handle) => handle.remove());
    };
  }, [isCapacitor, router]);
};
