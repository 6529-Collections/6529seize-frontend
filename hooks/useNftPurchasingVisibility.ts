"use client";

import { useNftPurchasingServerRender } from "@/components/common/NftPurchasingServerRender";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { Capacitor } from "@capacitor/core";
import { useSyncExternalStore } from "react";
import useCapacitor from "./useCapacitor";

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useNftPurchasingVisibility() {
  const { isIos } = useCapacitor();
  const { country, isCountryPending } = useCookieConsent();
  const serverRendersPurchasing = useNftPurchasingServerRender();
  const isHydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );
  const isRestricted = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });
  // iOS keeps purchasing hidden but does not redirect until the country check
  // settles, so a US cold deep link stays put. Android and web never wait.
  const isAwaitingIosCountry = isIos && isCountryPending;

  return {
    hideNftPurchasing: isHydrated
      ? isRestricted
      : hidesBeforeHydration(serverRendersPurchasing),
    shouldRedirect: isHydrated && isRestricted && !isAwaitingIosCountry,
  };
}

// Server HTML and the hydration render keep purchasing content out unless the
// root layout found the request clearly not from the iOS app. The browser
// checks again: the app injects Capacitor's native bridge before any page
// script runs, so if the app ever reaches the server without its cookie and
// user agent, the hydration render still hides purchasing content. Where that
// differs from the server HTML, React discards it and renders on the client.
function hidesBeforeHydration(serverRendersPurchasing: boolean): boolean {
  return !serverRendersPurchasing || Capacitor.getPlatform() === "ios";
}
