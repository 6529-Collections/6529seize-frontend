"use client";

import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { useEffect, useState, type SetStateAction } from "react";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import {
  readPendingMarketPurchases,
  useConfirmedMarketPurchases,
  usePendingMarketPurchases,
} from "./market-activity-store";
import {
  createCollectPurchaseHistory,
  unappliedCollectPurchases,
} from "./collect-purchase-history";
import {
  collectPurchaseMatchesOrder,
  reconcileCollectSelection,
} from "./collect-purchase-reconciliation";

/** The parent keys this state by profile and confirmed wallet membership. */
export function useCollectPurchaseSelection(
  profileId: string | null | undefined
) {
  const [listingTime, setListingTime] = useState(() => Date.now() / 1000);
  const purchases = useConfirmedMarketPurchases(profileId);
  const pending = usePendingMarketPurchases(profileId);
  const [state, setState] = useState(() => ({
    selection: [] as CollectSelectedListing[],
    settlementRevision: 0,
    purchases,
    history: createCollectPurchaseHistory(),
  }));
  if (state.purchases !== purchases) {
    const { history, unapplied } = unappliedCollectPurchases(
      state.history,
      purchases
    );
    setState({
      purchases,
      history,
      selection: reconcileCollectSelection(state.selection, unapplied),
      settlementRevision:
        state.settlementRevision + Number(unapplied.length > 0),
    });
  }
  const { selection, settlementRevision } = state;
  const setSelection = (next: SetStateAction<CollectSelectedListing[]>) =>
    setState((current) => ({
      ...current,
      selection: typeof next === "function" ? next(current.selection) : next,
    }));
  const setSettlementRevision = (next: SetStateAction<number>) =>
    setState((current) => ({
      ...current,
      settlementRevision:
        typeof next === "function" ? next(current.settlementRevision) : next,
    }));
  useEffect(() => {
    const timer = globalThis.setInterval(
      () => setListingTime(Date.now() / 1000),
      15_000
    );
    return () => globalThis.clearInterval(timer);
  }, []);
  const orderIsPending = (order: ApiMarketTradeOrder) =>
    pending.some((purchase) => collectPurchaseMatchesOrder(order, purchase));
  const orderIsPendingNow = (order: ApiMarketTradeOrder) =>
    Boolean(
      profileId &&
      readPendingMarketPurchases(profileId).some((purchase) =>
        collectPurchaseMatchesOrder(order, purchase)
      )
    );
  const clearSelection = () => {
    const currentPending = profileId
      ? readPendingMarketPurchases(profileId)
      : [];
    setSelection((current) =>
      current.filter((item) =>
        currentPending.some((purchase) =>
          collectPurchaseMatchesOrder(item.order, purchase)
        )
      )
    );
  };
  const availableSelection = selection.filter(
    (item) => !orderIsPending(item.order)
  );
  return {
    selection,
    availableSelection,
    setSelection,
    purchases,
    listingTime,
    settlementRevision,
    setSettlementRevision,
    orderIsPending,
    orderIsPendingNow,
    clearSelection,
  };
}
