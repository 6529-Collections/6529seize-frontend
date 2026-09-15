import {
  reconcileCollectOrder,
  reconcileCollectSelection,
} from "@/components/collect/collect-purchase-reconciliation";
import type { ConfirmedMarketPurchase } from "@/components/collect/market-activity-store";
import type { CollectSelectedListing } from "@/components/collect/collect-selection.helpers";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import { targetPlan } from "./collect-tdh-target.fixture";

const source = targetPlan().items[0]!;
function order(
  overrides: Partial<ApiMarketTradeOrder> = {}
): ApiMarketTradeOrder {
  return {
    ...source.order,
    side: ApiMarketTradeOrderSideEnum.Listing,
    quantity: "5",
    available_quantity: "5",
    purchase_quantity: "1",
    quantity_step: "1",
    total_wei: "500",
    net_wei: "495",
    fees: [{ recipient: source.order.maker, amount_wei: "5" }],
    ...overrides,
  };
}
function purchase(
  overrides: Partial<ConfirmedMarketPurchase> = {}
): ConfirmedMarketPurchase {
  return {
    operationId: "purchase-1",
    profileId: "profile",
    assetKey: source.asset.asset_key,
    protocolAddress: source.order.identity.protocol_address,
    orderHash: source.order.identity.order_hash,
    quantity: "2",
    remainingQuantity: "3",
    confirmedAt: 1_800_000_000_000,
    ...overrides,
  };
}
function selected(quantity = "4"): CollectSelectedListing {
  return { asset: source.asset, order: order(), quantity };
}

it("removes only the fully consumed order and keeps another listing of the artwork", () => {
  const original = order();
  const another = order({
    identity: { ...original.identity, order_hash: `0x${"d".repeat(64)}` },
  });
  const completed = [purchase({ remainingQuantity: "0", quantity: "5" })];
  expect(reconcileCollectOrder(original, completed)).toBeNull();
  expect(reconcileCollectOrder(another, completed)).toBe(another);
});

it("caps stale partial availability without changing quote prices or deducting an indexed fill twice", () => {
  const original = order();
  const fills = [purchase()];
  const projected = reconcileCollectOrder(original, fills);
  expect(projected).toEqual({ ...original, available_quantity: "3" });
  expect(reconcileCollectOrder(projected!, fills)).toBe(projected);
  const fresh = order({ available_quantity: "2" });
  expect(reconcileCollectOrder(fresh, fills)).toBe(fresh);
  expect(original.available_quantity).toBe("5");
});

it("keeps unknown remaining evidence for a normal refetch instead of guessing a fill", () => {
  const { remainingQuantity: _remaining, ...unknown } = purchase();
  const original = order();
  expect(reconcileCollectOrder(original, [unknown])).toBe(original);
});

it("matches protocol, hash and asset including address casing", () => {
  const original = order();
  expect(
    reconcileCollectOrder(original, [
      purchase({
        protocolAddress: original.identity.protocol_address.toUpperCase(),
        orderHash: original.identity.order_hash.toUpperCase(),
        remainingQuantity: "0",
      }),
    ])
  ).toBeNull();
  expect(
    reconcileCollectOrder(original, [
      purchase({
        protocolAddress: `0x${"b".repeat(40)}`,
        remainingQuantity: "0",
      }),
    ])
  ).toBe(original);
  expect(
    reconcileCollectOrder(original, [
      purchase({
        assetKey: `${source.asset.asset_key}1`,
        remainingQuantity: "0",
      }),
    ])
  ).toBe(original);
});

it("subtracts exact fulfilled selections once and preserves unrelated selections by reference", () => {
  const item = selected();
  const another = {
    ...selected(),
    order: order({
      identity: { ...item.order.identity, order_hash: `0x${"c".repeat(64)}` },
    }),
  };
  const fill = purchase();
  const reconciled = reconcileCollectSelection([item, another], [fill, fill]);
  expect(reconciled).toHaveLength(2);
  expect(reconciled[0]?.quantity).toBe("2");
  expect(reconciled[0]?.order.available_quantity).toBe("3");
  expect(reconciled[1]).toBe(another);
  expect(item.quantity).toBe("4");
});

it("removes a completed selection and combines independent fills of the same order", () => {
  expect(reconcileCollectSelection([selected("2")], [purchase()])).toEqual([]);
  expect(
    reconcileCollectSelection(
      [selected("4")],
      [
        purchase(),
        purchase({ operationId: "purchase-2", remainingQuantity: "1" }),
      ]
    )
  ).toEqual([]);
});

it("keeps a new remaining-copy selection when an older receipt arrives late", () => {
  const old = purchase();
  const laterSelection = { ...selected(), selectedAt: old.confirmedAt + 1 };
  expect(reconcileCollectSelection([laterSelection], [old])).toEqual([
    laterSelection,
  ]);
});

it("does not turn an indivisible lot into a new executable partial purchase", () => {
  const wholeLot = order({ purchase_quantity: "5", quantity_step: "5" });
  expect(reconcileCollectOrder(wholeLot, [purchase()])).toBeNull();
});
