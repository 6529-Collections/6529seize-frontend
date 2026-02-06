import type { NavItem as NavItemData, ViewKey } from "./navTypes";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

export const isNavItemActive = (
  item: NavItemData,
  pathname: string,
  searchParams: URLSearchParams,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean
): boolean => {
  if (item.name === "Network" && activeView === null) {
    // Profile pages (/[user])
    if (pathname.startsWith("/[user]")) {
      return true;
    }

    // Network related routes
    if (
      pathname === "/network" ||
      pathname.startsWith("/network/") ||
      pathname === "/nft-activity"
    ) {
      return true;
    }
  }

  // Collections routes
  if (item.name === "Collections" && activeView === null) {
    const relatedHrefs = [
      "/the-memes",
      "/6529-gradient",
      "/nextgen",
      "/meme-lab",
      "/rememes",
      "/xtdh",
    ];
    return relatedHrefs.some((href) => pathname.startsWith(href));
  }

  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const hasWaveParam = typeof waveParam === "string" && waveParam.length > 0;
  const isWavesPath = pathname === "/waves" || pathname.startsWith("/waves/");
  const isMessagesPath =
    pathname === "/messages" || pathname.startsWith("/messages/");
  const isWaveSubRoute = hasWaveParam && (isWavesPath || isMessagesPath);
  const viewParam = searchParams?.get("view");
  const isWavesView = isWavesPath || viewParam === "waves";
  const isMessagesView = isMessagesPath || viewParam === "messages";

  if (item.kind === "route") {
    if (item.name === "Home") {
      return (
        pathname === "/" &&
        activeView === null &&
        !hasWaveParam &&
        !isWavesView &&
        !isMessagesView
      );
    }
    if (item.name === "Discover") {
      return (
        (pathname === "/discover" || pathname.startsWith("/discover/")) &&
        activeView === null
      );
    }
    return pathname === item.href && activeView === null;
  }

  if (item.kind === "view" && item.viewKey === "waves") {
    if (activeView === "waves") return true;
    if (activeView === "messages") return false;
    if (isWaveSubRoute) return !isCurrentWaveDm;
    if (!hasWaveParam && (isWavesPath || isWavesView)) return true;
    return false;
  }

  if (item.kind === "view" && item.viewKey === "messages") {
    if (activeView === "messages") return true;
    if (activeView === "waves") return false;
    if (isWaveSubRoute) return isCurrentWaveDm;
    if (!hasWaveParam && (isMessagesPath || isMessagesView)) return true;
    return false;
  }

  return item.kind === "view" && activeView === item.viewKey;
};
