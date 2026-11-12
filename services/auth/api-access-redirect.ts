const RETURN_TO_PARAM = "returnTo";
const ACCESS_CONTROL_PATH = /^\/(?:access|restricted)(?:\/|$)/i;

export function getApiAccessPath(returnTo: string, hash = ""): string {
  const params = new URLSearchParams({ [RETURN_TO_PARAM]: returnTo });
  return `/access?${params}${hash}`;
}

export function getApiAccessReturnPath(search: string, hash: string): string {
  const returnTo = new URLSearchParams(search).get(RETURN_TO_PARAM);
  if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) return "/";

  const origin = "https://return.invalid";
  try {
    const destination = new URL(returnTo, origin);
    if (
      destination.origin !== origin ||
      destination.pathname.startsWith("//") ||
      ACCESS_CONTROL_PATH.test(decodeURIComponent(destination.pathname))
    ) {
      return "/";
    }

    // An HTTP redirect can carry the original fragment in the browser's URL.
    // Set it as a fragment so it cannot affect the destination's path or query.
    destination.hash ||= hash;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
  }
}

export function resumeAfterApiAccess(location: Location): void {
  location.replace(getApiAccessReturnPath(location.search, location.hash));
}
