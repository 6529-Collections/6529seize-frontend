"use client";

import useCapacitor from "./useCapacitor";
import { useHasHydrated } from "./useHasHydrated";

export function useNftPurchasingVisibility() {
  const { isIos } = useCapacitor();
  const isHydrated = useHasHydrated();

  return {
    hideNftPurchasing: !isHydrated || isIos,
    shouldRedirect: isHydrated && isIos,
    reservesNftPurchasingSpace: !isHydrated,
  };
}
