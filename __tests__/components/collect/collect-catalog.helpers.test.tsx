import { collectLowestArtworkEntries } from "@/components/collect/collect-catalog.helpers";
import { collectCatalogArtwork } from "@/components/collect/collect-catalog.adapters";
import type { CollectCatalogEntry } from "@/components/collect/useCollectCatalog";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";

jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));

const seller = `0x${"1".repeat(40)}`;
const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
function entry(
  token: string,
  price: string,
  hash: string
): CollectCatalogEntry {
  const assetKey = `1:${contract}:${token}`;
  return {
    asset: {
      asset_key: assetKey,
      chain_id: 1,
      contract,
      token_id: token,
      family: ApiCollectFamily.Memes,
      name: `Artwork ${token}`,
      image_url: null,
      artist_ids: [],
      season: 1,
      traits: [],
      hodl_rate: 1,
      tdh_eligible: true,
    },
    order: {
      identity: {
        protocol_address: MARKET_SEAPORT,
        order_hash: `0x${hash.repeat(64)}`,
      },
      asset_key: assetKey,
      maker: seller,
      recipient: MARKET_ZERO,
      side: ApiMarketTradeOrderSideEnum.Listing,
      quantity: "1",
      currency: MARKET_ZERO,
      total_wei: price,
      net_wei: price,
      fees: [],
      start_time: "1",
      end_time: "300",
    },
  };
}

it("shows each NFT once across pages at its cheapest supported purchase, retaining raw orders", () => {
  const dear = entry("1", "9007199254740994", "a");
  const cheap = entry("1", "9007199254740992", "b");
  const other = entry("2", "9007199254740993", "c");
  const raw = [dear, other, cheap, cheap];
  expect(collectLowestArtworkEntries(raw, [], 100)).toEqual([cheap, other]);
  expect(raw).toEqual([dear, other, cheap, cheap]);
  expect(dear.order?.identity.order_hash).toBe(`0x${"a".repeat(64)}`);
});

it("uses another seller when the cheapest ask belongs to a confirmed profile wallet", () => {
  const mine = entry("1", "1", "a");
  const other = entry("1", "2", "b");
  other.order!.maker = `0x${"2".repeat(40)}`;
  expect(collectLowestArtworkEntries([mine, other], [seller], 100)).toEqual([
    other,
  ]);
});

it("does not show an expired or unsupported purchase as a selectable cheapest artwork", () => {
  const expired = entry("1", "1", "a");
  expired.order!.end_time = "100";
  const unsupported = entry("2", "2", "b");
  Object.assign(unsupported.order!, {
    purchase_quantity: "1",
    quantity_step: "2",
  });
  expect(collectLowestArtworkEntries([expired, unsupported], [], 100)).toEqual(
    []
  );
});

it("prices a supported unit instead of its remaining lot and omits repetitive one-available text", () => {
  const item = entry("1", "8000000000000000", "a");
  Object.assign(item.order!, {
    quantity: "4",
    purchase_quantity: "1",
    quantity_step: "1",
    available_quantity: "4",
  });
  const view = collectCatalogArtwork(item, undefined, undefined, "en-US");
  expect(view.priceLabel).toBe("0.002 ETH");
  expect(view.priceDescription).toBe("4 available");
  expect(
    collectCatalogArtwork(entry("2", "10", "b"), undefined, undefined, "en-US")
      .priceDescription
  ).toBeUndefined();
});

it("labels indivisible lot prices and uses TDH's explicit availability", () => {
  const lot = entry("1", "3000000000000000", "a");
  lot.order!.quantity = "3";
  expect(
    collectCatalogArtwork(lot, undefined, undefined, "en-US").priceDescription
  ).toBe("Price for 3 copies");
  const item = entry("2", "10", "b");
  const tdhItem = {
    ...item,
    tdh: {
      asset: item.asset,
      order: item.order!,
      available_quantity: "12",
      purchase_quantity: "1",
      purchase_cost_wei: "10",
      rate_hundredths: "100",
      base_tdh_per_day_hundredths: "100",
    },
  };
  expect(
    collectCatalogArtwork(tdhItem, undefined, undefined, "en-US")
      .priceDescription
  ).toBe("12 available");
});

it("compares a TDH lot's total daily rate with its whole price and preserves that price", () => {
  const lot = entry("1", "3000000000000000000", "a");
  lot.order!.quantity = "3";
  const view = collectCatalogArtwork(
    {
      ...lot,
      tdh: {
        asset: lot.asset,
        order: lot.order!,
        available_quantity: "3",
        purchase_quantity: "3",
        purchase_cost_wei: "3000000000000000000",
        rate_hundredths: "125",
        base_tdh_per_day_hundredths: "375",
      },
    },
    undefined,
    undefined,
    "en-US"
  );
  expect(view.valueMetric).toEqual({
    value: "≈ 1.25",
    label: "base TDH/day per ETH",
  });
  expect(view.priceLabel).toBe("3 ETH");
  expect(view.priceDescription).toBe("Price for 3 copies");
  expect(view.sourceLabel).toBeUndefined();
});
