const CREATE_WAVE_ROUTE = "/waves/create";
export const CREATE_WAVE_QUERY_PARAM = "create";
export const CREATE_WAVE_QUERY_VALUE = "wave";

export const isCreateWavePathname = (pathname: string): boolean => {
  const routeSegments = CREATE_WAVE_ROUTE.split("/").filter(Boolean);
  const pathnameSegments = pathname.split("/").filter(Boolean);
  return pathnameSegments.some(
    (segment, index) =>
      segment === routeSegments[0] &&
      pathnameSegments[index + 1] === routeSegments[1]
  );
};

export const isCreateWaveSurface = ({
  pathname,
  createParam,
}: {
  readonly pathname: string;
  readonly createParam: string | null;
}): boolean => {
  return (
    isCreateWavePathname(pathname) || createParam === CREATE_WAVE_QUERY_VALUE
  );
};
