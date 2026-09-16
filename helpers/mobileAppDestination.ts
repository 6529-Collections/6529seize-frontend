const hasUnsafeCharacters = (value: string): boolean =>
  value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value);

const isRootRelativePath = (value: string): boolean =>
  value.startsWith("/") && !value.startsWith("//");

export function getMobileDestination(
  pathParam: string | null,
  origin: string
): string | null {
  if (!pathParam) {
    return null;
  }

  try {
    // URLSearchParams already decodes the query. Retain compatibility with
    // links that additionally encode the entire route, without decoding its
    // individual path segments or query values into URL delimiters.
    const path = pathParam.startsWith("/")
      ? pathParam
      : decodeURIComponent(pathParam);
    if (!isRootRelativePath(path) || hasUnsafeCharacters(path)) {
      return null;
    }

    // Reject malformed encoding while preserving escaped query/hash values.
    decodeURI(path);
    const destination = new URL(path, origin);
    const decodedPathname = decodeURIComponent(destination.pathname);
    if (
      destination.origin !== origin ||
      !isRootRelativePath(destination.pathname) ||
      !isRootRelativePath(decodedPathname) ||
      hasUnsafeCharacters(decodedPathname)
    ) {
      return null;
    }

    // Native routing may decode path segments. Check that representation too,
    // including dot segments that would expose a leading double slash.
    const decodedDestination = new URL(decodedPathname, origin);
    if (
      decodedDestination.origin !== origin ||
      !isRootRelativePath(decodedDestination.pathname)
    ) {
      return null;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}
