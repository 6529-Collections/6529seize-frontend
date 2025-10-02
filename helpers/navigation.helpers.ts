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
  const params = new URLSearchParams();

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, value);
      }
    });
  }

  params.set("wave", waveId);

  if (serialNo !== undefined) {
    params.set("serialNo", `${serialNo}/`);
  }

  const base = (() => {
    if (isApp) {
      return isDirectMessage ? "/messages" : "/waves";
    }
    return "/my-stream";
  })();

  const query = params.toString();
  return query ? `${base}?${query}` : base;
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
