import type { NavItem as NavItemData, ViewKey } from "./navTypes";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

export type NavSearchParams = Pick<URLSearchParams, "get">;

const ABOUT_ROUTE_PREFIXES = [
  "/about",
  "/network",
  "/delegation",
  "/tools",
  "/open-data",
  "/meme-accounting",
  "/meme-gas",
  "/emma",
  "/xtdh",
  "/rep/categories",
] as const;

const NFT_ROUTE_PREFIXES = [
  "/the-memes",
  "/6529-gradient",
  "/nextgen",
  "/meme-lab",
  "/rememes",
  "/nft-activity",
  "/meme-calendar",
] as const;

const LEGACY_COLLECTION_ROUTE_PREFIXES = [
  "/the-memes",
  "/6529-gradient",
  "/nextgen",
  "/meme-lab",
  "/rememes",
] as const;

type WaveRouteState = {
  readonly hasWaveParam: boolean;
  readonly isDiscoverPath: boolean;
  readonly isMessagesPath: boolean;
  readonly isMessagesView: boolean;
  readonly isWaveSubRoute: boolean;
  readonly isWavesPath: boolean;
  readonly isWavesView: boolean;
};

const matchesRoutePrefix = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

const matchesAnyRoutePrefix = (
  pathname: string,
  hrefs: readonly string[]
): boolean => hrefs.some((href) => matchesRoutePrefix(pathname, href));

const isLegacyNetworkRouteActive = (pathname: string): boolean =>
  pathname.startsWith("/[user]") ||
  pathname === "/nft-activity" ||
  pathname === "/xtdh" ||
  matchesRoutePrefix(pathname, "/network");

const getWaveRouteState = (
  pathname: string,
  searchParams: NavSearchParams
): WaveRouteState => {
  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const hasWaveParam = typeof waveParam === "string" && waveParam.length > 0;
  const isWavesPath = matchesRoutePrefix(pathname, "/waves");
  const isDiscoverPath = matchesRoutePrefix(pathname, "/discover");
  const isMessagesPath = matchesRoutePrefix(pathname, "/messages");
  const isWaveSubRoute = hasWaveParam && (isWavesPath || isMessagesPath);
  const viewParam = searchParams.get("view");
  const isWavesView = isWavesPath || viewParam === "waves";
  const isMessagesView = isMessagesPath || viewParam === "messages";

  return {
    hasWaveParam,
    isDiscoverPath,
    isMessagesPath,
    isMessagesView,
    isWaveSubRoute,
    isWavesPath,
    isWavesView,
  };
};

const isRouteItemActive = ({
  activeView,
  item,
  pathname,
  routeState,
}: {
  readonly activeView: ViewKey | null;
  readonly item: Extract<NavItemData, { kind: "route" }>;
  readonly pathname: string;
  readonly routeState: WaveRouteState;
}): boolean => {
  if (item.name === "Home") {
    return (
      pathname === "/" &&
      activeView === null &&
      !routeState.hasWaveParam &&
      !routeState.isWavesView &&
      !routeState.isMessagesView
    );
  }

  return activeView === null && matchesRoutePrefix(pathname, item.href);
};

const isWavesItemActive = ({
  activeView,
  isCurrentWaveDm,
  routeState,
}: {
  readonly activeView: ViewKey | null;
  readonly isCurrentWaveDm: boolean;
  readonly routeState: WaveRouteState;
}): boolean => {
  if (activeView === "waves") return true;
  if (activeView === "messages") return false;
  if (routeState.isWaveSubRoute) return !isCurrentWaveDm;
  return (
    !routeState.hasWaveParam &&
    (routeState.isWavesPath ||
      routeState.isWavesView ||
      routeState.isDiscoverPath)
  );
};

const isMessagesItemActive = ({
  activeView,
  isCurrentWaveDm,
  routeState,
}: {
  readonly activeView: ViewKey | null;
  readonly isCurrentWaveDm: boolean;
  readonly routeState: WaveRouteState;
}): boolean => {
  if (activeView === "messages") return true;
  if (activeView === "waves") return false;
  if (routeState.isWaveSubRoute) return isCurrentWaveDm;
  return (
    !routeState.hasWaveParam &&
    (routeState.isMessagesPath || routeState.isMessagesView)
  );
};

const isLegacyNavGroupActive = (
  itemName: string,
  pathname: string
): boolean => {
  if (itemName === "Network") {
    return isLegacyNetworkRouteActive(pathname);
  }
  if (itemName === "About") {
    return matchesAnyRoutePrefix(pathname, ABOUT_ROUTE_PREFIXES);
  }
  if (itemName === "NFTs") {
    return matchesAnyRoutePrefix(pathname, NFT_ROUTE_PREFIXES);
  }
  if (itemName === "Collections") {
    return matchesAnyRoutePrefix(pathname, LEGACY_COLLECTION_ROUTE_PREFIXES);
  }
  return false;
};

export const isNavItemActive = (
  item: NavItemData,
  pathname: string,
  searchParams: NavSearchParams,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean
): boolean => {
  if (activeView === null && isLegacyNavGroupActive(item.name, pathname)) {
    return true;
  }

  const routeState = getWaveRouteState(pathname, searchParams);
  if (item.kind === "route") {
    return isRouteItemActive({ activeView, item, pathname, routeState });
  }

  if (item.viewKey === "waves") {
    return isWavesItemActive({ activeView, isCurrentWaveDm, routeState });
  }

  return isMessagesItemActive({ activeView, isCurrentWaveDm, routeState });
};
