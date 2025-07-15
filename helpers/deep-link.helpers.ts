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
    // Check if it includes a scheme
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

    return {
      pathname,
      queryParams,
    };
  } catch (e) {
    console.error("Failed to resolve deep link:", e);
    return null;
  }
}
