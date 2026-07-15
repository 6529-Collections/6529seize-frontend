export const STREAM_INDEX_ROUTES = ["/waves", "/messages"] as const;

export const isTitleUpdateCurrent = (
  currentPathname: string | null,
  titlePathname: string | null,
  pathname: string | null
) => currentPathname === pathname || titlePathname === pathname;
