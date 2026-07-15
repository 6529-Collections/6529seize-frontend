export const STREAM_INDEX_ROUTES: readonly string[] = ["/waves", "/messages"];

export const isTitleUpdateCurrent = (
  currentPathname: string | null,
  titlePathname: string | null,
  pathname: string | null
) => currentPathname === pathname || titlePathname === pathname;
