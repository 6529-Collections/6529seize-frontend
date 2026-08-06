export const PAGE_SHARE_UNSUPPORTED_PATHS = [
  "/",
  "/waves",
  "/messages",
  "/notifications",
] as const;

export const PAGE_SHARE_UNSUPPORTED_VIEWS = ["waves", "messages"] as const;

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

  return !PAGE_SHARE_UNSUPPORTED_VIEWS.some((view) => view === activeView);
}
