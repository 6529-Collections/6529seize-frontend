import {
  createCollectPurchaseHistory,
  unappliedCollectPurchases,
} from "@/components/collect/collect-purchase-history";
import type { ConfirmedMarketPurchase } from "@/components/collect/market-activity-store";

const purchase = (index: number): ConfirmedMarketPurchase => ({
  profileId: "profile",
  operationId: `operation-${index}`,
  assetKey: "asset",
  protocolAddress: "protocol",
  orderHash: "order",
  quantity: "1",
  confirmedAt: index,
});
function historyReader(limit?: number) {
  let history = createCollectPurchaseHistory();
  return (purchases: readonly ConfirmedMarketPurchase[]) => {
    const result = unappliedCollectPurchases(history, purchases, limit);
    history = result.history;
    return result.unapplied;
  };
}
it("deduplicates exact evidence with its profile and all order identity parts", () => {
  const read = historyReader();
  const first = purchase(1);
  expect(read([first, first])).toEqual([first]);
  expect(read([{ ...first }])).toEqual([]);
  expect(read([{ ...first, profileId: "other" }])).toHaveLength(1);
  expect(read([{ ...first, orderHash: "different" }])).toHaveLength(1);
});
it("does not replay historical evidence after bounded deduplication pruning", () => {
  const read = historyReader(3);
  expect(
    read([purchase(1), purchase(2), purchase(3), purchase(4)])
  ).toHaveLength(4);
  expect(read([purchase(1), purchase(2), purchase(3), purchase(4)])).toEqual(
    []
  );
  expect(read([purchase(5)])).toEqual([purchase(5)]);
  expect(read([purchase(2)])).toEqual([]);
  expect(read([{ ...purchase(1), profileId: "other" }])).toHaveLength(1);
});
it("leaves the prior history unchanged when React abandons a render", () => {
  const history = createCollectPurchaseHistory();
  const purchases = [purchase(1)];
  expect(unappliedCollectPurchases(history, purchases).unapplied).toEqual(
    purchases
  );
  expect(unappliedCollectPurchases(history, purchases).unapplied).toEqual(
    purchases
  );
  expect(history.seen.size).toBe(0);
});
