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
  const { country } = useCookieConsent();
  const isHydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );
  const isRestricted = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });

  return {
    // The server cannot identify the native shell. Keep purchasing content out
    // of its HTML and the matching first hydration render.
    hideNftPurchasing: !isHydrated || isRestricted,
    shouldRedirect: isHydrated && isRestricted,
  };
}
