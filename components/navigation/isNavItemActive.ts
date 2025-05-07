import type { NextRouter } from "next/router";
import type { NavItem as NavItemData, ViewKey } from "./navTypes";

export const isNavItemActive = (
  item: NavItemData,
  router: NextRouter,
  activeView: ViewKey | null,
): boolean => {
  // User profile pages should activate the Network icon
  if (item.name === "Network" && router.pathname.startsWith("/[user]")) {
    return true;
  }

  if (item.name === "Network") {
    const path = router.pathname;
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
    return activeView === item.viewKey || isWaveSubRoute;
  }

  return activeView === item.viewKey;
}; 