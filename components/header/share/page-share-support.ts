export const PAGE_SHARE_UNSUPPORTED_PATHS = [
  "/messages",
  "/notifications",
] as const;

const PAGE_SHARE_UNSUPPORTED_VIEWS = new Set(["messages"]);

type PageShareSurface = "desktop-web" | "mobile";

export function isPageShareSupported({
  activeView,
  pathname,
  surface,
}: {
  readonly activeView: string | null;
  readonly pathname: string;
  readonly surface: PageShareSurface;
}): boolean {
  if (pathname === "/" && surface !== "desktop-web") {
    return false;
  }

  const isUnsupportedPath = PAGE_SHARE_UNSUPPORTED_PATHS.some(
    (unsupportedPath) =>
      pathname === unsupportedPath || pathname.startsWith(`${unsupportedPath}/`)
  );

  if (isUnsupportedPath) {
    return false;
  }

  return !activeView || !PAGE_SHARE_UNSUPPORTED_VIEWS.has(activeView);
}
