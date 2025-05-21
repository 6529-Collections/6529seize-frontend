import type { NextRouter } from "next/router";
import type { NavItem as NavItemData, ViewKey } from "./navTypes";

const isNetworkRelatedRoute = (pathname: string): boolean => {
  return pathname === "/network" || 
         pathname.startsWith("/network/") || 
         pathname === "/nft-activity" ||
         pathname.startsWith("/[user]");
};

const isStreamRouteActive = (router: NextRouter, activeView: ViewKey | null): boolean => {
  return (
    router.pathname === "/my-stream" &&
    activeView === null &&
    typeof router.query.wave !== "string"
  );
};

const isWaveSubRoute = (router: NextRouter): boolean => {
  return router.pathname === "/my-stream" && typeof router.query.wave === "string";
};

export const isNavItemActive = (
  item: NavItemData,
  router: NextRouter,
  activeView: ViewKey | null,
  isCurrentWaveDm: boolean
): boolean => {
  // Handle Network routes
  if (item.name === "Network" && activeView === null) {
    return isNetworkRelatedRoute(router.pathname);
  }

  // Handle standard routes
  if (item.kind === "route") {
    if (item.name === "Stream") {
      return isStreamRouteActive(router, activeView);
    }
    return router.pathname === item.href && activeView === null;
  }

  // Handle view-based items
  const waveSubRoute = isWaveSubRoute(router);
  
  // Handle waves view
  if (item.viewKey === "waves") {
    if (activeView === "waves") return true;
    if (activeView === "messages") return false;
    return waveSubRoute && !isCurrentWaveDm;
  }

  // Handle messages view
  if (item.viewKey === "messages") {
    if (activeView === "messages") return true;
    if (activeView === "waves") return false;
    return waveSubRoute && isCurrentWaveDm;
  }

  return activeView === item.viewKey;
}; 