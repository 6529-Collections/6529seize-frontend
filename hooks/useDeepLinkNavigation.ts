"use client";

import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { useCallback, useEffect } from "react";
import useCapacitor from "./useCapacitor";
import { resolveDeepLink } from "@/helpers/deep-link.helpers";

export const useDeepLinkNavigation = () => {
  const { isCapacitor } = useCapacitor();
  const router = useRouter();

  const doNavigation = useCallback(
    (pathname: string, query: Record<string, string | number>) => {
      const searchParams = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)])
      );
      const url = `${pathname}?${searchParams.toString()}`;

      console.log("Deep Link Navigation", url);
      router.push(url);
    },
    [router]
  );

  const handleDeepLink = useCallback(
    (deepLinkUrl: string) => {
      const resolved = resolveDeepLink(deepLinkUrl);

      if (resolved) {
        doNavigation(resolved.pathname, resolved.queryParams);
      } else {
        console.log("Unknown or invalid deep link:", deepLinkUrl);
      }
    },
    [doNavigation]
  );

  useEffect(() => {
    if (!isCapacitor) return;

    const listener = App.addListener("appUrlOpen", (data) => {
      handleDeepLink(data.url);
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [handleDeepLink]);
};
