import { isCompetitionPathname } from "@/helpers/competition.helpers";
import {
  getActiveWaveIdFromUrl,
  getMessageIdFromPathname,
  getWaveIdFromPathname,
} from "@/helpers/navigation.helpers";

export const getMissingWaveNavigationRoute = (
  waveId: string | null
): URL | null => {
  if (!waveId || typeof window === "undefined") {
    return null;
  }

  // A query retry keeps the callback from request start, even after navigation.
  const route = new URL(window.location.href);
  const isWaveRoute =
    route.pathname === "/waves" ||
    route.pathname === "/messages" ||
    getWaveIdFromPathname(route.pathname) !== null ||
    getMessageIdFromPathname(route.pathname) !== null;
  if (
    !isWaveRoute ||
    isCompetitionPathname(route.pathname) ||
    getActiveWaveIdFromUrl({
      pathname: route.pathname,
      searchParams: route.searchParams,
    }) !== waveId
  ) {
    return null;
  }

  return route;
};
