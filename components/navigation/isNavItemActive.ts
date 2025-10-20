import type { HomeTab } from "@/components/home/useHomeTabs";
import type { NavItem as NavItemData, ViewKey } from "./navTypes";

export const isNavItemActive = (
  item: NavItemData,
  pathname: string,
  searchParams: URLSearchParams,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean,
  homeActiveTab: HomeTab
): boolean => {
  // User profile pages and Network routes are active only when no in-app view is selected
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
    ];
    return relatedHrefs.some((href) => pathname.startsWith(href));
  }

  const waveParam = searchParams?.get("wave");
  const hasWaveParam = typeof waveParam === "string";
  const isWavesPath = pathname === "/waves";
  const isMessagesPath = pathname === "/messages";
  const tabParam = searchParams?.get("tab");
  const isFeedTab = homeActiveTab === "feed";
  const isHomeFeedPath = pathname === "/" && (tabParam === "feed" || isFeedTab);
  const isWaveSubRoute =
    hasWaveParam && (isHomeFeedPath || isWavesPath || isMessagesPath);
  const viewParam = searchParams?.get("view");
  const isWavesView = pathname === "/waves" || viewParam === "waves";
  const isMessagesView = pathname === "/messages" || viewParam === "messages";

  if (item.kind === "route") {
    if (item.name === "Stream") {
      return isHomeFeedPath && activeView === null;
    }
    if (item.name === "Home") {
      return (
        pathname === "/" &&
        activeView === null &&
        !isFeedTab &&
        !hasWaveParam &&
        !isWavesView &&
        !isMessagesView
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
