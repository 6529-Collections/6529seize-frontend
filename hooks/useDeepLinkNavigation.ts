"use client";

import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { useEffect, useEffectEvent } from "react";
import useCapacitor from "./useCapacitor";

export enum DeepLinkScope {
  NAVIGATE = "navigate",
  SHARE_CONNECTION = "share-connection",
}

export const useDeepLinkNavigation = () => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();

  const doNavigation = useEffectEvent(
    (pathname: string, query: Record<string, string | number>) => {
      const searchParams = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)])
      );
      const url = `${pathname}?${searchParams.toString()}`;

      console.log("Deep Link Navigation", url);
      router.push(url);
    }
  );

  useEffect(() => {
    if (!isCapacitor) return;

    const listener = App.addListener("appUrlOpen", (data) => {
      const urlString = data.url;

      const schemeEndIndex = urlString.indexOf("://") + 3;
      const urlWithoutScheme = urlString.slice(schemeEndIndex);

      const [scope, ...pathParts] = urlWithoutScheme.split("?")[0].split("/");

      const queryString = urlWithoutScheme.includes("?")
        ? urlWithoutScheme.split("?")[1]
        : "";

      const searchParams = new URLSearchParams(queryString);
      const queryParams: Record<string, string | number> = Object.fromEntries(
        searchParams.entries()
      );
      queryParams["_t"] = Math.floor(Date.now() / 1000);

      switch (scope) {
        case DeepLinkScope.NAVIGATE:
          doNavigation(`/${pathParts.join("/")}`, queryParams);
          break;
        case DeepLinkScope.SHARE_CONNECTION:
          doNavigation("/accept-connection-sharing", queryParams);
          break;
        default:
          console.log("Unknown Deep Link Scope", scope);
          break;
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [isCapacitor]);
};
