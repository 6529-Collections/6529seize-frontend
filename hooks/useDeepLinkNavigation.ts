import { useRouter } from "next/router";
import { App } from "@capacitor/app";
import { useCallback, useEffect } from "react";

export enum DeepLinkScope {
  NAVIGATE = "navigate",
  SHARE_CONNECTION = "share-connection",
}

export const useDeepLinkNavigation = () => {
  const router = useRouter();

  const doNavigation = useCallback(
    (pathname: string, queryParams: Record<string, string | number>) => {
      const isSamePath = router.asPath.includes(pathname);
      const navigationMethod = isSamePath ? "replace" : "push";

      router[navigationMethod]({ pathname, query: queryParams }, undefined, {
        shallow: false,
      });
    },
    [router]
  );

  useEffect(() => {
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
      queryParams["_t"] = Date.now() / 1000;

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
  }, [doNavigation]);
};
