export const mainSegment = (url: string): string => {
  const pathname = url.split(/[?#]/)[0];
  const [, first] = pathname.split("/");
  return first ? `/${first.toLowerCase()}` : "/";
};

export const sameMainPath = (a: string, b: string): boolean => mainSegment(a) === mainSegment(b);

export const getHomeLatestRoute = (): string => "/";

export const getHomeFeedRoute = (): string => "/";

export const getHomeRoute = (isApp: boolean): string => (isApp ? "/" : "/my-stream");

export const getWavesBaseRoute = (isApp: boolean): string =>
  isApp ? "/waves" : "/my-stream?view=waves";

export const getMessagesBaseRoute = (isApp: boolean): string =>
  isApp ? "/messages" : "/my-stream?view=messages";

export const getNotificationsRoute = (isApp: boolean): string =>
  isApp ? "/notifications" : "/my-stream/notifications";

export const getWaveRoute = ({
  waveId,
  serialNo,
  extraParams,
  isDirectMessage,
  isApp,
}: {
  waveId: string;
  serialNo?: string | number;
  extraParams?: Record<string, string | undefined>;
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
    const serialString = `${serialNo}`;
    const normalizedSerial = serialString === "0" ? serialString : `${serialString}/`;
    queryEntries.push(["serialNo", normalizedSerial]);
  }

  const base = (() => {
    if (isApp) {
      return isDirectMessage ? "/messages" : "/waves";
    }
    return "/my-stream";
  })();

  if (queryEntries.length === 0) {
    return base;
  }

  const query = queryEntries
    .map(([key, value]) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = key === "serialNo"
        ? encodeURIComponent(value).replace(/%2F/g, "/")
        : encodeURIComponent(value);
      return `${encodedKey}=${encodedValue}`;
    })
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
  if (isApp) {
    return isDirectMessage ? "/messages" : "/waves";
  }
  return "/my-stream";
};
