import type { NavItem as NavItemData, ViewKey } from "./navTypes";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

export type NavSearchParams = Pick<URLSearchParams, "get">;

type ActiveContext = {
  readonly pathname: string;
  readonly activeView: ViewKey | null;
  readonly hasWaveParam: boolean;
  readonly isWavesView: boolean;
  readonly isMessagesView: boolean;
  readonly isWaveSubRoute: boolean;
  readonly isCurrentWaveDm: boolean;
};

const COLLECTION_ROUTE_PREFIXES = [
  "/the-memes",
  "/6529-gradient",
  "/nextgen",
  "/meme-lab",
  "/rememes",
] as const;

const isNetworkRoute = (pathname: string): boolean =>
  pathname.startsWith("/[user]") ||
  pathname === "/network" ||
  pathname.startsWith("/network/") ||
  pathname === "/nft-activity" ||
  pathname === "/xtdh";

const isCollectionsRoute = (pathname: string): boolean =>
  COLLECTION_ROUTE_PREFIXES.some((href) => pathname.startsWith(href));

const isHomeRouteActive = ({
  pathname,
  activeView,
  hasWaveParam,
  isWavesView,
  isMessagesView,
}: ActiveContext): boolean =>
  pathname === "/" &&
  activeView === null &&
  !hasWaveParam &&
  !isWavesView &&
  !isMessagesView;

const isRouteItemActive = (
  item: Extract<NavItemData, { kind: "route" }>,
  context: ActiveContext
): boolean => {
  const { pathname, activeView } = context;

  if (item.name === "Network") {
    return activeView === null && isNetworkRoute(pathname);
  }

  if (item.name === "Collections") {
    return activeView === null && isCollectionsRoute(pathname);
  }

  if (item.name === "Home") {
    return isHomeRouteActive(context);
  }

  return pathname === item.href && activeView === null;
};

const getWaveSubRouteView = ({
  isWaveSubRoute,
  isCurrentWaveDm,
}: ActiveContext): ViewKey | null => {
  if (!isWaveSubRoute) {
    return null;
  }
  return isCurrentWaveDm ? "messages" : "waves";
};

const isViewItemActive = (
  item: Extract<NavItemData, { kind: "view" }>,
  context: ActiveContext
): boolean => {
  const { activeView, hasWaveParam, isWavesView, isMessagesView } = context;

  if (activeView !== null) {
    return activeView === item.viewKey;
  }

  const waveSubRouteView = getWaveSubRouteView(context);

  if (waveSubRouteView !== null) {
    return waveSubRouteView === item.viewKey;
  }

  if (item.viewKey === "waves") {
    return !hasWaveParam && isWavesView;
  }

  return !hasWaveParam && isMessagesView;
};

export const isNavItemActive = (
  item: NavItemData,
  pathname: string,
  searchParams: NavSearchParams,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean
): boolean => {
  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const hasWaveParam = typeof waveParam === "string" && waveParam.length > 0;
  const isWavesPath = pathname === "/waves" || pathname.startsWith("/waves/");
  const isMessagesPath =
    pathname === "/messages" || pathname.startsWith("/messages/");
  const viewParam = searchParams.get("view");
  const context: ActiveContext = {
    pathname,
    activeView,
    hasWaveParam,
    isWavesView: isWavesPath || viewParam === "waves",
    isMessagesView: isMessagesPath || viewParam === "messages",
    isWaveSubRoute: hasWaveParam && (isWavesPath || isMessagesPath),
    isCurrentWaveDm,
  };

  if (item.kind === "route") {
    return isRouteItemActive(item, context);
  }

  return isViewItemActive(item, context);
};
