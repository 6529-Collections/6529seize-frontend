"use client";

import { useEffect } from "react";
import { useNftPurchasingVisibility } from "./useNftPurchasingVisibility";

export function useNftMarketRoute(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get" | "toString">,
  marketPathDestination?: string
) {
  const { hideNftPurchasing, shouldRedirect } = useNftPurchasingVisibility();
  const requestedMarket =
    marketPathDestination !== undefined ||
    searchParams.get("focus") === "listings-and-offers" ||
    Boolean(searchParams.get("order"));
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

  return { hideNftPurchasing, redirectToArtwork };
}
