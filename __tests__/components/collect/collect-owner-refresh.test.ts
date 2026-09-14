import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import {
  collectOwnerRefreshInterval,
  collectOwnershipCoversPurchase,
} from "@/components/collect/collect-owner-refresh";
import type { ConfirmedMarketPurchase } from "@/components/collect/market-activity-store";
import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";

const now = 1_800_000_000_000;
const profileId = "profile";
const analysis: Pick<ApiCollectAnalysis, "account" | "holdings_snapshot"> = {
  account: {
    profile_id: profileId,
    consolidation_key: "profile",
    wallets: [],
    membership_hash: "membership",
  },
  holdings_snapshot: { block_number: 99, nextgen_block_number: 99 },
};

it("distinguishes positive catch-up evidence from an expired retry window", () => {
  const assetKey = `1:${MEMES_CONTRACT}:1`;
  const old = purchase(assetKey, { confirmedAt: now - 600_000 });
  expect(
    collectOwnerRefreshInterval({
      assetKey,
      profileId,
      purchases: [old],
      analysis,
      now,
    })
  ).toBe(false);
  expect(collectOwnershipCoversPurchase(profileId, analysis, old)).toBe(false);
  const caughtUp = {
    ...analysis,
    holdings_snapshot: { block_number: 100, nextgen_block_number: 99 },
  };
  expect(collectOwnershipCoversPurchase(profileId, caughtUp, old)).toBe(true);
  expect(collectOwnershipCoversPurchase("other", caughtUp, old)).toBe(false);
});
function purchase(
  assetKey: string,
  overrides: Partial<ConfirmedMarketPurchase> = {}
): ConfirmedMarketPurchase {
  return {
    operationId: "purchase",
    profileId,
    assetKey,
    protocolAddress: `0x${"11".repeat(20)}`,
    orderHash: `0x${"22".repeat(32)}`,
    quantity: "1",
    confirmedAt: now - 60_000,
    blockNumber: 100,
    ...overrides,
  };
}

it.each([
  MEMES_CONTRACT,
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  NEXTGEN_CONTRACT,
])(
  "uses the correct family watermark for %s and stops only at the receipt block",
  (contract) => {
    const assetKey = `1:${contract}:1`;
    const options = {
      assetKey,
      profileId,
      purchases: [purchase(assetKey)],
      analysis,
      now,
    };
    expect(collectOwnerRefreshInterval(options)).toBe(30_000);
    const unrelatedAhead =
      contract === NEXTGEN_CONTRACT
        ? { block_number: 500, nextgen_block_number: 99 }
        : { block_number: 99, nextgen_block_number: 500 };
    expect(
      collectOwnerRefreshInterval({
        ...options,
        analysis: { ...analysis, holdings_snapshot: unrelatedAhead },
      })
    ).toBe(30_000);
    expect(
      collectOwnerRefreshInterval({
        ...options,
        analysis: {
          ...analysis,
          holdings_snapshot: { block_number: 100, nextgen_block_number: 100 },
        },
      })
    ).toBe(false);
  }
);
it.each([undefined, null, 0, Number.NaN])(
  "retries a missing or invalid relevant watermark %s",
  (block) => {
    const assetKey = `1:${MEMES_CONTRACT}:1`;
    expect(
      collectOwnerRefreshInterval({
        assetKey,
        profileId,
        purchases: [purchase(assetKey)],
        now,
        analysis:
          block === undefined
            ? undefined
            : {
                ...analysis,
                holdings_snapshot: {
                  block_number: block,
                  nextgen_block_number: 500,
                },
              },
      })
    ).toBe(30_000);
  }
);
it("requires a known receipt block and fresh account binding even when a watermark is ahead", () => {
  const assetKey = `1:${MEMES_CONTRACT}:1`;
  const options = { assetKey, profileId, purchases: [purchase(assetKey)], now };
  const { blockNumber: _block, ...unknownBlock } = purchase(assetKey);
  expect(
    collectOwnerRefreshInterval({
      ...options,
      purchases: [unknownBlock],
      analysis: {
        ...analysis,
        holdings_snapshot: { block_number: 500, nextgen_block_number: 500 },
      },
    })
  ).toBe(30_000);
  expect(
    collectOwnerRefreshInterval({
      ...options,
      analysis: {
        ...analysis,
        account: { ...analysis.account, profile_id: "other" },
      },
    })
  ).toBe(30_000);
});
it("does not renew the ten-minute window or poll future/unknown receipt times", () => {
  const assetKey = `1:${MEMES_CONTRACT}:1`;
  for (const confirmedAt of [0, Number.NaN, now + 1, now - 600_000]) {
    expect(
      collectOwnerRefreshInterval({
        assetKey,
        profileId,
        purchases: [purchase(assetKey, { confirmedAt })],
        analysis,
        now,
      })
    ).toBe(false);
  }
  expect(
    collectOwnerRefreshInterval({
      assetKey,
      profileId,
      purchases: [purchase(assetKey)],
      analysis,
      now: now + 600_000,
    })
  ).toBe(false);
});
it("ignores another profile, artwork, chain and unsupported collection", () => {
  const assetKey = `1:${MEMES_CONTRACT}:1`;
  const options = { assetKey, profileId, analysis, now };
  expect(
    collectOwnerRefreshInterval({
      ...options,
      purchases: [purchase(assetKey, { profileId: "other" })],
    })
  ).toBe(false);
  expect(
    collectOwnerRefreshInterval({
      ...options,
      purchases: [purchase(`${assetKey}0`)],
    })
  ).toBe(false);
  for (const unsupported of [
    `2:${MEMES_CONTRACT}:1`,
    `1:0x${"99".repeat(20)}:1`,
  ]) {
    expect(
      collectOwnerRefreshInterval({
        ...options,
        assetKey: unsupported,
        purchases: [purchase(unsupported)],
      })
    ).toBe(false);
  }
});
