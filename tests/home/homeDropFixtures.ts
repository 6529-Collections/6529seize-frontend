import type { Page } from "@playwright/test";
import {
  decodeFunctionData,
  encodeFunctionResult,
  multicall3Abi,
  toFunctionSelector,
  zeroAddress,
  zeroHash,
} from "viem";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../abis/abis";

export const loadingTestArtwork = {
  id: 536,
  name: "Homepage loading test artwork",
  artist: "Test artist",
  artist_seize_handle: "",
  image: "https://6529.io/home-loading-fixture.png",
  scaled: "https://6529.io/home-loading-fixture.png",
  animation: null,
  floor_price: 0,
  collection: "The Memes",
  season: 1,
};

export async function installLoadingTestArtwork(page: Page) {
  await page.route("**/home-loading-fixture.png", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#777"/></svg>',
    })
  );
  await page.route("https://rpc.walletconnect.org/**", (route) =>
    // A terminal response exercises the unavailable state without transport retries.
    route.fulfill({ status: 400, json: { error: "Fixture RPC unavailable" } })
  );
}

export async function installCompletedMintStatus(
  page: Page,
  ready: Promise<void> = Promise.resolve(),
  tokenId = loadingTestArtwork.id
) {
  await installMintStatus(page, { total: 328, endDate: 2, tokenId, ready });
}

export async function installActiveMintStatus(page: Page) {
  await installMintStatus(page, {
    total: 100,
    endDate: Math.floor(Date.now() / 1000) + 3600,
    tokenId: loadingTestArtwork.id,
    ready: Promise.resolve(),
  });
}

async function installMintStatus(
  page: Page,
  {
    total,
    endDate,
    tokenId,
    ready,
  }: {
    readonly total: number;
    readonly endDate: number;
    readonly tokenId: number;
    readonly ready: Promise<void>;
  }
) {
  const claimResult = encodeFunctionResult({
    abi: MEMES_MANIFOLD_PROXY_ABI,
    functionName: "getClaimForToken",
    result: [
      1n,
      {
        total,
        totalMax: 328,
        walletMax: 0,
        startDate: 1,
        endDate,
        storageProtocol: 0,
        merkleRoot: zeroHash,
        location: "",
        tokenId: BigInt(tokenId),
        cost: 0n,
        paymentReceiver: zeroAddress,
        erc20: zeroAddress,
        signingAddress: zeroAddress,
      },
    ],
  });
  const selector = toFunctionSelector("getClaimForToken(address,uint256)");
  await page.route("https://rpc.walletconnect.org/**", async (route) => {
    const rpc = route.request().postDataJSON();
    if (rpc.method !== "eth_call") {
      await route.abort();
      return;
    }
    await ready;
    let result = claimResult;
    if (!rpc.params[0].data.startsWith(selector)) {
      const { args, functionName } = decodeFunctionData({
        abi: multicall3Abi,
        data: rpc.params[0].data,
      });
      if (functionName !== "aggregate3")
        throw new Error("Unexpected fixture RPC call");
      result = encodeFunctionResult({
        abi: multicall3Abi,
        functionName,
        result: args[0].map((call) => ({
          success: call.callData.startsWith(selector),
          returnData: call.callData.startsWith(selector) ? claimResult : "0x",
        })),
      });
    }
    await route.fulfill({ json: { jsonrpc: "2.0", id: rpc.id, result } });
  });
}

export const comingUpWave = {
  id: "00000000-0000-4000-8000-000000000529",
  name: "Coming Up fixture",
};
export const comingUpSettings = { memes_wave_id: comingUpWave.id };
export const comingUpLeaderboard = {
  wave: comingUpWave,
  count: 3,
  page: 1,
  next: false,
  drops: [1, 2, 3].map((rank) => ({
    id: `coming-up-${rank}`,
    serial_no: rank,
    title: `Coming Up artwork ${rank}`,
    drop_type: "SUBMISSION",
    created_at: 1,
    is_signed: false,
    hide_link_preview: false,
    parts_count: 1,
    boosts: 0,
    author: {
      id: "coming-up-artist",
      handle: "coming-up-artist",
      level: 1,
      primary_address: "0x0000000000000000000000000000000000000529",
      classification: "PSEUDONYM",
      badges: {},
    },
  })),
};
export const comingUpLeaderboardPattern = (url: URL) =>
  /\/api\/v2\/waves\/[^/]+\/leaderboard$/.test(url.pathname) &&
  url.searchParams.get("page_size") === "3";

export async function installComingUpFixture(page: Page) {
  await installLoadingTestArtwork(page);
  await page.route("**/api/memes_lite", (route) =>
    route.fulfill({
      json: {
        data: Array.from({ length: 5 }, (_, index) => ({
          ...loadingTestArtwork,
          id: loadingTestArtwork.id - index,
          name: `Recent Meme ${index}`,
        })),
      },
    })
  );
  await page.route("**/api/settings", (route) =>
    route.fulfill({ json: comingUpSettings })
  );
  await page.route("**/api/memes_latest", (route) =>
    route.fulfill({ json: loadingTestArtwork })
  );
  await page.route("**/api/v2/waves/*/decisions?*", (route) =>
    route.fulfill({ json: { data: [], page: 1, count: 0, next: false } })
  );
}
