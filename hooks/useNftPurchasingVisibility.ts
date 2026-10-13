"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useSyncExternalStore } from "react";
import useCapacitor from "./useCapacitor";

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useNftPurchasingVisibility() {
  const { isIos } = useCapacitor();
  const { country, isCountryPending } = useCookieConsent();
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
    // The server cannot identify the native shell. Keep purchasing content out
    // of its HTML and the matching first hydration render.
    hideNftPurchasing: !isHydrated || isRestricted,
    shouldRedirect: isHydrated && isRestricted && !isAwaitingIosCountry,
  };
}
