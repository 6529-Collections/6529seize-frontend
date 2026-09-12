import {
  resolveCollectPlanSelection,
  collectPlanSelectionCost,
} from "@/components/collect/collect-plan-selection.helpers";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { fetchCollectAssets } from "@/services/api/collect-api";
import {
  fetchExactMarketOrder,
  fetchMarketOrders,
} from "@/services/api/market-api";

jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssets: jest.fn(),
}));
jest.mock("@/services/api/market-api", () => ({
  fetchExactMarketOrder: jest.fn(),
  fetchMarketOrders: jest.fn(),
}));
const assets = jest.mocked(fetchCollectAssets),
  orders = jest.mocked(fetchExactMarketOrder);
const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
function fixture(token = "1") {
  const asset: ApiCollectAsset = {
    asset_key: `1:${contract}:${token}`,
    chain_id: 1,
    contract,
    token_id: token,
    family: ApiCollectFamily.Memes,
    name: `Artwork ${token}`,
    image_url: null,
    artist_ids: [],
    season: 1,
    traits: [],
    hodl_rate: null,
    tdh_eligible: true,
  };
  const order: ApiMarketTradeOrder = {
    identity: {
      protocol_address: MARKET_SEAPORT,
      order_hash: `0x${BigInt(token).toString(16).padStart(64, "0")}`,
    },
    asset_key: asset.asset_key,
    maker: `0x${"2".repeat(40)}`,
    recipient: `0x${"2".repeat(40)}`,
    side: ApiMarketTradeOrderSideEnum.Listing,
    quantity: "2",
    purchase_quantity: "1",
    quantity_step: "1",
    available_quantity: "2",
    currency: MARKET_ZERO,
    total_wei: "200",
    net_wei: "198",
    fees: [{ recipient: `0x${"3".repeat(40)}`, amount_wei: "2" }],
    start_time: "1",
    end_time: "9999999999",
  };
  const leg: ApiCollectPlanLeg = {
    candidate_id: token,
    order_id: order.identity.order_hash,
    asset_key: asset.asset_key,
    quantity: "2",
    unit_price_wei: "100",
  };
  return { asset, order, leg };
}
function mockFixture(f = fixture()) {
  assets.mockResolvedValue({
    data: [f.asset],
    count: 1,
    page: 1,
    next: false,
    catalog_version: "catalog",
  });
  orders.mockResolvedValue(f.order);
  return f;
}
beforeEach(() => jest.resetAllMocks());

it("preserves selected order identity and exact quantity with whole-lot price basis", async () => {
  const f = mockFixture();
  const signal = new AbortController().signal;
  const result = await resolveCollectPlanSelection([f.leg], [], signal);
  expect(result).toEqual([{ asset: f.asset, order: f.order, quantity: "2" }]);
  expect(orders).toHaveBeenCalledWith(
    f.leg.order_id,
    MARKET_SEAPORT,
    f.leg.asset_key,
    "LISTING",
    signal
  );
  expect(collectPlanSelectionCost([f.leg])).toBe("200");
});
it("resolves a valid selected order outside the limited discovery results", async () => {
  const f = mockFixture();
  jest.mocked(fetchMarketOrders).mockResolvedValue({
    orders: [fixture("9").order],
    source: "OpenSea",
    observed_at: 1,
    complete: false,
  });
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).resolves.toEqual([{ asset: f.asset, order: f.order, quantity: "2" }]);
  expect(fetchMarketOrders).not.toHaveBeenCalled();
});
it("does not fall back to another listing when exact order resolution fails", async () => {
  const f = mockFixture();
  const unavailable = Object.assign(new Error("ORDER_MISMATCH"), {
    status: 409,
  });
  orders.mockRejectedValue(unavailable);
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).rejects.toBe(unavailable);
  expect(fetchMarketOrders).not.toHaveBeenCalled();
});
it("searches subsequent catalog pages for the canonical exact asset", async () => {
  const f = mockFixture();
  assets
    .mockResolvedValueOnce({
      data: [fixture("10").asset],
      count: 25,
      page: 1,
      next: true,
      catalog_version: "catalog",
    })
    .mockResolvedValueOnce({
      data: [f.asset],
      count: 25,
      page: 2,
      next: false,
      catalog_version: "catalog",
    });
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).resolves.toHaveLength(1);
  expect(assets.mock.calls.map(([input]) => input.page)).toEqual([1, 2]);
});
it("rejects stalled catalog pagination", async () => {
  const f = mockFixture();
  assets.mockImplementation(async ({ page }) => ({
    data: [fixture("10").asset],
    count: 100,
    page,
    next: true,
    catalog_version: "catalog",
  }));
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).rejects.toThrow("ASSET_SEARCH_INCOMPLETE");
  expect(assets).toHaveBeenCalledTimes(2);
  expect(orders).not.toHaveBeenCalled();
});
it("caps progressing catalog searches at 100 pages", async () => {
  const f = mockFixture();
  assets.mockImplementation(async ({ page }) => ({
    data: [fixture(String(page + 100)).asset],
    count: 10000,
    page,
    next: true,
    catalog_version: "catalog",
  }));
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).rejects.toThrow("ASSET_SEARCH_INCOMPLETE");
  expect(assets).toHaveBeenCalledTimes(100);
});
it.each(["hash", "protocol", "asset", "quantity", "fee"])(
  "never substitutes a changed %s",
  async (field) => {
    const f = mockFixture();
    if (field === "hash")
      f.order.identity.order_hash = fixture("9").order.identity.order_hash;
    if (field === "protocol") f.order.identity.protocol_address = MARKET_ZERO;
    if (field === "asset") f.order.asset_key = fixture("9").asset.asset_key;
    if (field === "quantity") f.order.available_quantity = "1";
    if (field === "fee") {
      f.leg.quantity = "1";
      f.order.net_wei = "199";
      f.order.fees[0]!.amount_wei = "1";
    }
    await expect(
      resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
    ).rejects.toThrow("ORDER_GONE");
  }
);
it("requires a new plan when exact fresh cost differs from the observed unit price", async () => {
  const f = mockFixture();
  f.leg.unit_price_wei = "101";
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).rejects.toThrow("PLAN_PRICE_CHANGED");
});
it("accepts legacy plans without a stored price only through fresh exact pricing", async () => {
  const f = mockFixture();
  delete f.leg.unit_price_wei;
  expect(collectPlanSelectionCost([f.leg])).toBeNull();
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).resolves.toHaveLength(1);
});
it("rejects contradictory canonical asset metadata", async () => {
  const f = mockFixture();
  f.asset.token_id = "2";
  await expect(
    resolveCollectPlanSelection([f.leg], [], new AbortController().signal)
  ).rejects.toThrow("UNSUPPORTED_ASSET");
});
it("does not start requests for over-limit or duplicate order selections", async () => {
  const f = mockFixture();
  await expect(
    resolveCollectPlanSelection(
      Array(129).fill(f.leg),
      [],
      new AbortController().signal
    )
  ).rejects.toThrow("PLAN_SELECTION_LIMIT");
  await expect(
    resolveCollectPlanSelection(
      [f.leg, f.leg],
      [],
      new AbortController().signal
    )
  ).rejects.toThrow("ORDER_GONE");
  expect(assets).not.toHaveBeenCalled();
});
it("bounds active fetching to four and preserves selected leg ordering", async () => {
  let active = 0,
    peak = 0;
  assets.mockImplementation(async ({ query, page }) => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
    return {
      data: [fixture(query).asset],
      count: 1,
      page,
      next: false,
      catalog_version: "catalog",
    };
  });
  orders.mockImplementation(async (_hash, _protocol, key) => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
    return fixture(key.split(":")[2]!).order;
  });
  const legs = Array.from(
    { length: 128 },
    (_, i) => fixture(String(i + 1)).leg
  );
  const result = await resolveCollectPlanSelection(
    legs,
    [],
    new AbortController().signal
  );
  expect(peak).toBe(4);
  expect(result.map((item) => item.asset.asset_key)).toEqual(
    legs.map((leg) => leg.asset_key)
  );
});
it("stops after cancellation and passes the signal to each request", async () => {
  const f = mockFixture(),
    controller = new AbortController();
  assets.mockImplementation(async (input) => {
    expect(input.signal).toBe(controller.signal);
    controller.abort();
    return {
      data: [f.asset],
      count: 1,
      page: 1,
      next: false,
      catalog_version: "catalog",
    };
  });
  await expect(
    resolveCollectPlanSelection([f.leg], [], controller.signal)
  ).rejects.toThrow();
  expect(orders).not.toHaveBeenCalled();
});
it("rejects a late exact order after cancellation and keeps the same request signal", async () => {
  const f = mockFixture();
  const controller = new AbortController();
  orders.mockImplementation(
    async (_hash, _protocol, _assetKey, _side, signal) => {
      expect(signal).toBe(controller.signal);
      controller.abort();
      return f.order;
    }
  );
  await expect(
    resolveCollectPlanSelection([f.leg], [], controller.signal)
  ).rejects.toThrow();
  expect(orders).toHaveBeenCalledTimes(1);
  expect(fetchMarketOrders).not.toHaveBeenCalled();
});
