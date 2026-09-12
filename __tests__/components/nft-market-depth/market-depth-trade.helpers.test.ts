import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import {
  marketDepthListingSelection,
  marketDepthOfferIsExecutable,
  marketDepthSelectionConflict,
  matchFreshMarketDepthOrder,
  signerOfferQuantityCap,
} from "@/components/nft-market-depth/market-depth-trade.helpers";
import {
  MARKET_SEAPORT,
  MARKET_WETH,
  MARKET_ZERO,
} from "@/components/collect/market-validation";

const HASH = `0x${"a".repeat(64)}`;
const ASSET_KEY = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:8";
const MAKER = "0x1111111111111111111111111111111111111111";

const asset: ApiCollectAsset = {
  asset_key: ASSET_KEY,
  chain_id: 1,
  contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
  token_id: "8",
  family: ApiCollectFamily.Memes,
  name: "Card 8",
  image_url: null,
  artist_ids: [],
  season: 1,
  traits: [],
  hodl_rate: null,
  tdh_eligible: true,
};

function tradeOrder(
  overrides: Partial<ApiMarketTradeOrder> = {}
): ApiMarketTradeOrder {
  return {
    identity: { protocol_address: MARKET_SEAPORT, order_hash: HASH },
    asset_key: ASSET_KEY,
    maker: MAKER,
    side: ApiMarketTradeOrderSideEnum.Listing,
    quantity: "2",
    available_quantity: "2",
    purchase_quantity: "1",
    quantity_step: "1",
    currency: MARKET_ZERO,
    total_wei: "200",
    net_wei: "180",
    fees: [
      {
        recipient: "0x2222222222222222222222222222222222222222",
        amount_wei: "20",
      },
    ],
    start_time: "100",
    end_time: "200",
    recipient: MAKER,
    ...overrides,
  };
}

function depthOrder(overrides: Partial<ApiMarketOrder> = {}): ApiMarketOrder {
  return {
    order_key: "depth-order",
    order_id: HASH,
    source: "opensea",
    protocol: MARKET_SEAPORT,
    collection_slug: "the-memes-by-6529",
    side: ApiMarketOrderSideEnum.Ask,
    scope: ApiMarketOrderScopeEnum.Token,
    maker: MAKER,
    token_id: "8",
    original_quantity: "2",
    remaining_quantity: "2",
    currency: { address: MARKET_ZERO, symbol: "ETH", decimals: 18 },
    total_price_raw: "200",
    unit_price: "0.0000000000000001",
    starts_at: new Date(100_000),
    expires_at: new Date(200_000),
    observed_at: new Date(150_000),
    applicability: ApiMarketOrderApplicabilityEnum.Token,
    liquidity_group: `maker:${MAKER}:${ASSET_KEY}:eth`,
    caveats: [],
    ...overrides,
  };
}

describe("market depth executable-order bridge", () => {
  it("requires one exact immutable identity and rejects side, currency, and expiry drift", () => {
    expect(
      matchFreshMarketDepthOrder({
        order: tradeOrder(),
        depthOrder: depthOrder(),
        assetKey: ASSET_KEY,
        side: ApiMarketTradeOrderSideEnum.Listing,
        nowSeconds: 150,
      })
    ).toEqual({ order: tradeOrder() });

    for (const changed of [
      tradeOrder({
        identity: {
          protocol_address: MARKET_SEAPORT,
          order_hash: `0x${"b".repeat(64)}`,
        },
      }),
      tradeOrder({ side: ApiMarketTradeOrderSideEnum.Offer }),
      tradeOrder({ asset_key: `${ASSET_KEY}-changed` }),
      tradeOrder({ currency: MARKET_WETH }),
      tradeOrder({ end_time: "150" }),
    ]) {
      expect(
        matchFreshMarketDepthOrder({
          order: changed,
          depthOrder: depthOrder(),
          assetKey: ASSET_KEY,
          side: ApiMarketTradeOrderSideEnum.Listing,
          nowSeconds: 150,
        })
      ).not.toHaveProperty("order");
    }
  });

  it("does not select a listing made by any consolidated profile wallet", () => {
    expect(
      marketDepthListingSelection({
        asset,
        depthOrder: depthOrder(),
        order: tradeOrder(),
        quantity: "1",
        profileWallets: [MAKER.toUpperCase()],
        nowSeconds: 150,
      })
    ).toBeNull();
    expect(
      marketDepthListingSelection({
        asset,
        depthOrder: depthOrder(),
        order: tradeOrder(),
        quantity: "2",
        profileWallets: [],
        nowSeconds: 150,
      })
    ).toMatchObject({ quantity: "2" });
  });

  it("accepts WETH offers bound to this NFT, including collection-wide offers from another profile", () => {
    const offer = tradeOrder({
      side: ApiMarketTradeOrderSideEnum.Offer,
      currency: MARKET_WETH,
    });
    const bid = depthOrder({
      side: ApiMarketOrderSideEnum.Bid,
      currency: { address: MARKET_WETH, symbol: "WETH", decimals: 18 },
    });
    expect(
      marketDepthOfferIsExecutable({
        asset,
        depthOrder: bid,
        order: offer,
        profileWallets: [],
        nowSeconds: 150,
      })
    ).toBe(true);
    expect(
      marketDepthOfferIsExecutable({
        asset,
        depthOrder: {
          ...bid,
          scope: ApiMarketOrderScopeEnum.Collection,
          applicability: ApiMarketOrderApplicabilityEnum.Collection,
          token_id: null,
        },
        order: offer,
        profileWallets: [],
        nowSeconds: 150,
      })
    ).toBe(true);
    expect(
      marketDepthOfferIsExecutable({
        asset,
        depthOrder: bid,
        order: offer,
        profileWallets: [MAKER],
        nowSeconds: 150,
      })
    ).toBe(false);
  });

  it("caps the offer quantity at the connected signer's step-aligned holding", () => {
    const wallet = "0x3333333333333333333333333333333333333333";
    const analysis = {
      account: { profile_id: "profile-1" },
      requirements: [
        {
          holdings: [
            { asset_key: ASSET_KEY, wallet, quantity: "2" },
            { asset_key: ASSET_KEY, wallet, quantity: "1" },
          ],
        },
      ],
    } as ApiCollectAnalysis;
    expect(
      signerOfferQuantityCap({
        analysis,
        profileId: "profile-1",
        wallet,
        assetKey: ASSET_KEY,
        order: tradeOrder(),
      })
    ).toBe("2");
    expect(
      signerOfferQuantityCap({
        analysis,
        profileId: "another-profile",
        wallet,
        assetKey: ASSET_KEY,
        order: tradeOrder(),
      })
    ).toBeNull();
    expect(
      signerOfferQuantityCap({
        analysis: {
          ...analysis,
          requirements: [
            {
              holdings: [
                {
                  asset_key: ASSET_KEY,
                  wallet,
                  quantity: (1n << 256n).toString(),
                },
              ],
            },
          ],
        } as ApiCollectAnalysis,
        profileId: "profile-1",
        wallet,
        assetKey: ASSET_KEY,
        order: tradeOrder(),
      })
    ).toBeNull();
  });

  it("blocks duplicate orders, shared ERC1155 inventory, and all duplicate ERC721 assets", () => {
    const first = marketDepthListingSelection({
      asset,
      depthOrder: depthOrder(),
      order: tradeOrder(),
      quantity: "1",
      profileWallets: [],
      nowSeconds: 150,
    })!;
    expect(marketDepthSelectionConflict([first], first)).toBe("duplicate");

    const overlapping = {
      ...first,
      order: tradeOrder({
        identity: {
          protocol_address: MARKET_SEAPORT,
          order_hash: `0x${"c".repeat(64)}`,
        },
      }),
    };
    expect(marketDepthSelectionConflict([first], overlapping)).toBe("overlap");

    const sharedGroupAcrossAssets = {
      ...overlapping,
      asset: {
        ...asset,
        asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:9",
        token_id: "9",
      },
      order: {
        ...overlapping.order,
        asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:9",
        maker: "0x5555555555555555555555555555555555555555",
      },
    };
    expect(marketDepthSelectionConflict([first], sharedGroupAcrossAssets)).toBe(
      "overlap"
    );

    const independent = {
      ...overlapping,
      depthOrder: {
        ...overlapping.depthOrder,
        liquidity_group: "independent-group",
      },
      order: {
        ...overlapping.order,
        maker: "0x5555555555555555555555555555555555555555",
      },
    };
    expect(marketDepthSelectionConflict([first], independent)).toBeNull();

    const erc721 = {
      ...first,
      asset: { ...asset, family: ApiCollectFamily.Gradients },
      depthOrder: { ...first.depthOrder, liquidity_group: "different" },
      order: {
        ...first.order,
        maker: "0x4444444444444444444444444444444444444444",
        identity: {
          protocol_address: MARKET_SEAPORT,
          order_hash: `0x${"d".repeat(64)}`,
        },
      },
    };
    expect(
      marketDepthSelectionConflict([{ ...first, asset: erc721.asset }], erc721)
    ).toBe("overlap");
  });
});
