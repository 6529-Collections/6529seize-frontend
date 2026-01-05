export const mainSegment = (url: string): string => {
  const pathname = url.split(/[?#]/)[0];
  const [, first] = pathname!.split("/");
  return first ? `/${first.toLowerCase()}` : "/";
};

export const sameMainPath = (a: string, b: string): boolean => mainSegment(a) === mainSegment(b);

export const getHomeLatestRoute = (): string => "/";

export const getHomeFeedRoute = (): string => "/?tab=feed";

export const getWavesBaseRoute = (_isApp: boolean): string => "/waves";

export const getMessagesBaseRoute = (_isApp: boolean): string => "/messages";

export const getNotificationsRoute = (_isApp: boolean): string => "/notifications";

export const getWaveRoute = ({
  waveId,
  serialNo,
  extraParams,
  isDirectMessage,
  isApp: _isApp,
}: {
  waveId: string;
  serialNo?: string | number | undefined;
  extraParams?: Record<string, string | undefined> | undefined;
  isDirectMessage: boolean;
  isApp: boolean;
}): string => {
  const queryEntries: Array<[string, string]> = [];

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null) {
        queryEntries.push([key, value]);
      }
    }
  }

  queryEntries.push(["wave", waveId]);

  if (serialNo !== undefined) {
    queryEntries.push(["serialNo", `${serialNo}`]);
  }

  const base = isDirectMessage ? "/messages" : "/waves";

  if (queryEntries.length === 0) {
    return base;
  }

  const query = queryEntries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return `${base}?${query}`;
};

export const getWaveHomeRoute = ({
  isDirectMessage,
  isApp,
}: {
  isDirectMessage: boolean;
  isApp: boolean;
}): string => {
  return isDirectMessage
    ? getMessagesBaseRoute(isApp)
    : getWavesBaseRoute(isApp);
};

export const navigateToDirectMessage = ({
  waveId,
  router,
  isApp,
}: {
  waveId: string;
  router: { push: (url: string) => void; replace: (url: string) => void };
  isApp: boolean;
}): void => {
  const href = getWaveRoute({
    waveId,
    isDirectMessage: true,
    isApp,
  });
  if (isApp) {
    router.replace(href);
  } else {
    router.push(href);
  }
};
