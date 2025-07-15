export enum DeepLinkScope {
  NAVIGATE = "navigate",
  SHARE_CONNECTION = "share-connection",
}

export function resolveDeepLink(
  deepLinkUrl: string
): { pathname: string; queryParams: Record<string, string | number> } | null {
  if (!deepLinkUrl) {
    return null;
  }

  try {
    const schemeEndIndex = deepLinkUrl.indexOf("://") + 3;
    const urlWithoutScheme = deepLinkUrl.slice(schemeEndIndex);

    const [scope, ...pathParts] = urlWithoutScheme.split("?")[0].split("/");

    const queryString = urlWithoutScheme.includes("?")
      ? urlWithoutScheme.split("?")[1]
      : "";

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

    return {
      pathname,
      queryParams,
    };
  } catch (e) {
    console.error("Failed to resolve deep link:", e);
    return null;
  }
}
