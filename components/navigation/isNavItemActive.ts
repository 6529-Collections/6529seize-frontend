import type { NavItem as NavItemData, ViewKey } from "./navTypes";

export const isNavItemActive = (
  item: NavItemData,
  pathname: string,
  searchParams: URLSearchParams,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean
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

  const isWaveSubRoute =
    pathname === "/my-stream" && typeof searchParams?.get("wave") === "string";

  if (item.kind === "route") {
    if (item.name === "Stream") {
      return (
        pathname === item.href &&
        activeView === null &&
        typeof searchParams?.get("wave") !== "string"
      );
    }
    return pathname === item.href && activeView === null;
  }

  if (item.viewKey === "waves") {
    if (activeView === "waves") return true;
    if (activeView === "messages") return false;
    return isWaveSubRoute && !isCurrentWaveDm;
  }

  if (item.viewKey === "messages") {
    if (activeView === "messages") return true;
    if (activeView === "waves") return false;
    return isWaveSubRoute && isCurrentWaveDm;
  }

  return activeView === item.viewKey;
};
