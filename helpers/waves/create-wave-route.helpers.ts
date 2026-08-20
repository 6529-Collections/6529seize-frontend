const CREATE_WAVE_ROUTE = "/waves/create";
export const CREATE_WAVE_QUERY_PARAM = "create";
export const CREATE_WAVE_QUERY_VALUE = "wave";

export const isCreateWavePathname = (pathname: string): boolean => {
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  return (
    normalizedPathname === CREATE_WAVE_ROUTE ||
    normalizedPathname.startsWith(`${CREATE_WAVE_ROUTE}/`) ||
    normalizedPathname.endsWith(CREATE_WAVE_ROUTE) ||
    normalizedPathname.includes(`${CREATE_WAVE_ROUTE}/`)
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
