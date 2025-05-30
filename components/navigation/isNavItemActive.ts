import type { NextRouter } from "next/router";
import type { NavItem as NavItemData, ViewKey } from "./navTypes";

export const isNavItemActive = (
  item: NavItemData,
  router: NextRouter,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean
): boolean => {
  // User profile pages and Network routes are active only when no in-app view is selected
  if (item.name === "Network" && activeView === null) {
    const path = router.pathname;

    // Profile pages (/[user])
    if (router.pathname.startsWith("/[user]")) {
      return true;
    }

    // Network related routes
    if (path === "/network" || path.startsWith("/network/") || path === "/nft-activity") {
      return true;
    }
  }

  const isWaveSubRoute =
    router.pathname === "/my-stream" && typeof router.query.wave === "string";

  if (item.kind === "route") {
    if (item.name === "Stream") {
      return (
        router.pathname === item.href &&
        activeView === null &&
        typeof router.query.wave !== "string"
      );
    }
    return router.pathname === item.href && activeView === null;
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