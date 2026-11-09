"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { readUsCountryHint } from "@/components/cookies/usCountryHint";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useSyncExternalStore } from "react";
import useCapacitor from "./useCapacitor";
import { useHasHydrated } from "./useHasHydrated";

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const noHint = () => false;

export function useNftPurchasingVisibility() {
  const { isIos } = useCapacitor();
  const isHydrated = useHasHydrated();

  return {
    hideNftPurchasing: !isHydrated || isIos,
    shouldRedirect: isHydrated && isIos,
    reservesNftPurchasingSpace: !isHydrated,
  };
}

// The profile can still show existing subscription history where it did
// before. The purchase controls on that page use the platform-only gate.
export function useSubscriptionPageVisibility() {
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
  // Storage is read only after hydration and only in the iOS app. The server
  // and hydration renders use the fixed `false` snapshot (isIos is also false
  // there), so the first client render always equals the server HTML.
  const hasUsCountryHint = useSyncExternalStore(
    subscribe,
    isIos ? readUsCountryHint : noHint,
    noHint
  );
  // One HTML for every visitor: the server HTML and the hydration render never
  // contain purchasing content, so no request decides it and nothing can reach
  // the iOS app before the browser checks the platform. Web and Android mount
  // it in the first render after hydration; iOS waits for the country check.
  const hideNftPurchasing = !isHydrated || isRestricted;
  const shouldRedirect = isHydrated && isRestricted && !isAwaitingIosCountry;

  return {
    hideNftPurchasing,
    shouldRedirect,
    // Whether a hidden slot should keep its blank space because the content may
    // still appear: always before hydration, where the platform is unknown, so
    // web and Android do not jump when it mounts; on iOS only while a country
    // check runs on a device whose last completed check was US. A restricted
    // result collapses it. The hint is layout only, never permission.
    reservesNftPurchasingSpace:
      hideNftPurchasing && (!isIos || (!shouldRedirect && hasUsCountryHint)),
  };
}
