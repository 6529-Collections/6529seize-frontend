export const PAGE_SHARE_UNSUPPORTED_PATHS = [
  "/",
  "/messages",
  "/notifications",
] as const;

const PAGE_SHARE_UNSUPPORTED_VIEWS: readonly string[] = ["messages"];

export function isPageShareSupported({
  activeView,
  pathname,
}: {
  readonly activeView: string | null;
  readonly pathname: string;
}): boolean {
  const isUnsupportedPath = PAGE_SHARE_UNSUPPORTED_PATHS.some(
    (unsupportedPath) =>
      pathname === unsupportedPath ||
      (unsupportedPath !== "/" && pathname.startsWith(`${unsupportedPath}/`))
  );

  if (isUnsupportedPath) {
    return false;
  }

  return !activeView || !PAGE_SHARE_UNSUPPORTED_VIEWS.includes(activeView);
}
