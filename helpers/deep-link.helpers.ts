import { App as CapacitorApp } from "@capacitor/app";

export enum DeepLinkScope {
  NAVIGATE = "navigate",
  SHARE_CONNECTION = "share-connection",
}

export function resolveDeepLink(deepLinkUrl: string): string | null {
  if (!deepLinkUrl) {
    return null;
  }

  try {
    let pathPart = deepLinkUrl;
    if (deepLinkUrl.includes("://")) {
      const schemeEndIndex = deepLinkUrl.indexOf("://") + 3;
      pathPart = deepLinkUrl.slice(schemeEndIndex);
    }

    const [rawPath, queryString = ""] = pathPart.split("?");

    const [scope, ...pathParts] = rawPath.split("/");

    const searchParams = new URLSearchParams(queryString);
    const queryParams: Record<string, string | number> = Object.fromEntries(
      searchParams.entries()
    );

    let pathname: string;

    switch (scope) {
      case DeepLinkScope.NAVIGATE:
        pathname = `/${pathParts.join("/")}`;
        break;
      case DeepLinkScope.SHARE_CONNECTION:
        pathname = "/accept-connection-sharing";
        break;
      default:
        pathname = "/";
        break;
    }

    const params = new URLSearchParams(
      Object.entries(queryParams).map(([k, v]) => [k, String(v)])
    );
    const targetUrl = `${pathname}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    return targetUrl;
  } catch (e) {
    console.error("Failed to resolve deep link:", e);
    return null;
  }
}

export async function initDeepLink(): Promise<string | null> {
  // Guard #1: only initial history entry
  const hist = window.history.state;
  if (hist?.idx > 0) {
    return null;
  }

  // Guard #2: only once per session
  const key = "deepLinkHandled";
  if (!sessionStorage.getItem(key)) {
    const info = await CapacitorApp.getLaunchUrl();
    sessionStorage.setItem(key, "1");

    if (info?.url) {
      return resolveDeepLink(info.url);
    }
  }

  return null;
}
