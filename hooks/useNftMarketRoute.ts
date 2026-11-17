"use client";

import { useEffect } from "react";
import { useNftPurchasingVisibility } from "./useNftPurchasingVisibility";

export function useNftMarketRoute(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get" | "toString">,
  marketPathDestination?: string
) {
  const { hideNftPurchasing, shouldRedirect, reservesNftPurchasingSpace } =
    useNftPurchasingVisibility();
  const requestedMarket =
    marketPathDestination !== undefined ||
    searchParams.get("focus") === "listings-and-offers" ||
    Boolean(searchParams.get("order"));
  // Render artwork while the platform is unknown. Rewrite the URL only once
  // iOS is confirmed, so web market links retain their target during hydration.
  const redirectToArtwork = hideNftPurchasing && requestedMarket;

  useEffect(() => {
    if (!shouldRedirect || !requestedMarket) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("focus");
    params.delete("order");
    const query = params.toString();
    globalThis.history.replaceState(
      null,
      "",
      (marketPathDestination ?? pathname) +
        (query ? "?" + query : "") +
        globalThis.location.hash
    );
  }, [
    marketPathDestination,
    pathname,
    requestedMarket,
    searchParams,
    shouldRedirect,
  ]);

  return { hideNftPurchasing, redirectToArtwork, reservesNftPurchasingSpace };
}
