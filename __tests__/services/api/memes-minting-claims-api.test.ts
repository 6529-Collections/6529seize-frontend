import { MEMES_CONTRACT } from "@/constants/constants";
import {
  getDistributionAirdropsArtist,
  getDistributionAirdropsTeam,
  getMemesMintingClaimActions,
  getMemesMintingClaimActionTypes,
  getMemesMintingRoots,
  upsertMemesMintingClaimAction,
} from "@/services/api/memes-minting-claims-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { createDeferredPromise } from "../../utils/deferredPromise";

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: jest.fn(),
  getAuthJwt: jest.fn(),
  getWalletAddress: () => null,
  getWalletRole: () => null,
  hasActiveSessionV2Auth: () => false,
}));

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
globalThis.fetch = fetchMock;

function mockFetchOk<T>(body: T): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe("memes-minting-claims-api", () => {
  const encodedContract = encodeURIComponent(MEMES_CONTRACT);

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
  });

  it("starts immediately and shares overlapping roots requests for the same card", async () => {
    const response = createDeferredPromise<Response>();
    const roots = [{ phase: "Phase 0", merkle_root: "0x123" }];
    fetchMock.mockReturnValue(response.promise);
    const requests = Array.from({ length: 4 }, () => getMemesMintingRoots(123));

    try {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.test.6529.io/api/minting-claims/${encodedContract}/123/roots`,
        expect.objectContaining({ method: "GET" })
      );
    } finally {
      response.resolve(mockFetchOk(roots));
      await Promise.all(requests);
    }
    expect(await Promise.all(requests)).toEqual([roots, roots, roots, roots]);
  });

  it("fetches fresh roots after the previous request has finished", async () => {
    const original = [{ phase: "Phase 0", merkle_root: "0x123" }];
    const updated = [{ phase: "Phase 1", merkle_root: "0x456" }];
    fetchMock.mockResolvedValueOnce(mockFetchOk(original));
    expect(await getMemesMintingRoots(123)).toEqual(original);

    fetchMock.mockResolvedValueOnce(mockFetchOk(updated));
    expect(await getMemesMintingRoots(123)).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps different cards separate even when responses arrive out of order", async () => {
    const oldResponse = createDeferredPromise<Response>();
    const newResponse = createDeferredPromise<Response>();
    const oldRoots = [{ phase: "Phase 0", merkle_root: "0x123" }];
    const newRoots = [{ phase: "Phase 1", merkle_root: "0x456" }];
    fetchMock.mockReturnValueOnce(oldResponse.promise);
    fetchMock.mockReturnValue(newResponse.promise);

    const oldRequest = getMemesMintingRoots(123);
    const newRequest = getMemesMintingRoots(124);
    const joinedRequest = getMemesMintingRoots(124);
    try {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      newResponse.resolve(mockFetchOk(newRoots));
      expect(await newRequest).toEqual(newRoots);
      expect(await joinedRequest).toEqual(newRoots);
    } finally {
      oldResponse.resolve(mockFetchOk(oldRoots));
      newResponse.resolve(mockFetchOk(newRoots));
      await Promise.all([oldRequest, newRequest, joinedRequest]);
    }
    expect(await oldRequest).toEqual(oldRoots);
  });

  it("shares a failure without caching it or preventing the next request", async () => {
    const response = createDeferredPromise<Response>();
    fetchMock.mockReturnValue(response.promise);
    const failure = new Error("offline");
    const requests = Promise.allSettled([
      getMemesMintingRoots(123),
      getMemesMintingRoots(123),
    ]);
    response.reject(failure);
    expect(await requests).toEqual([
      { status: "rejected", reason: failure },
      { status: "rejected", reason: failure },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(mockFetchOk([]));
    expect(await getMemesMintingRoots(123)).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares the request until its response body has finished loading", async () => {
    const body = createDeferredPromise<unknown[]>();
    const bodyStarted = createDeferredPromise<void>();
    const json = jest.fn(() => {
      bodyStarted.resolve(undefined);
      return body.promise;
    });
    fetchMock.mockResolvedValue({ ok: true, json } as unknown as Response);
    const first = getMemesMintingRoots(123);
    await bodyStarted.promise;
    const second = getMemesMintingRoots(123);

    try {
      expect(json).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      body.resolve([]);
      await Promise.all([first, second]);
    }
  });

  it("fetches supported MEMES claim action types", async () => {
    fetchMock.mockResolvedValue(
      mockFetchOk({
        contract: MEMES_CONTRACT,
        action_types: ["ARTIST_AIRDROP", "TEAM_AIRDROP"],
      })
    );

    const response = await getMemesMintingClaimActionTypes();

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/minting-claims/actions/${encodedContract}/types`,
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(response.action_types).toEqual(["ARTIST_AIRDROP", "TEAM_AIRDROP"]);
  });

  it("fetches MEMES claim actions by claim id", async () => {
    fetchMock.mockResolvedValue(
      mockFetchOk({
        contract: MEMES_CONTRACT,
        claim_id: 123,
        actions: [{ action: "ARTIST_AIRDROP", completed: false }],
      })
    );

    const response = await getMemesMintingClaimActions(123);
    const [firstAction] = response.actions;

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/minting-claims/actions/${encodedContract}/123`,
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(response.actions).toHaveLength(1);
    expect(firstAction?.action).toBe("ARTIST_AIRDROP");
  });

  it("upserts a MEMES claim action", async () => {
    (getAuthJwt as jest.Mock).mockReturnValue("jwt");
    fetchMock.mockResolvedValue(
      mockFetchOk({
        contract: MEMES_CONTRACT,
        claim_id: 123,
        actions: [{ action: "ARTIST_AIRDROP", completed: true }],
      })
    );

    const response = await upsertMemesMintingClaimAction(123, {
      action: "ARTIST_AIRDROP",
      completed: true,
    });
    const [firstAction] = response.actions;

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/minting-claims/actions/${encodedContract}/123`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          action: "ARTIST_AIRDROP",
          completed: true,
        }),
      })
    );
    expect(firstAction?.completed).toBe(true);
  });

  it("fetches artist airdrops from the split json endpoint", async () => {
    fetchMock.mockResolvedValue(mockFetchOk([{ wallet: "0xabc", amount: 2 }]));

    const response = await getDistributionAirdropsArtist(MEMES_CONTRACT, 123);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/distributions/${MEMES_CONTRACT}/123/artist-airdrops`,
      expect.objectContaining({
        method: "GET",
        headers: {},
      })
    );
    expect(response).toEqual([{ wallet: "0xabc", amount: 2 }]);
  });

  it("fetches team airdrops from the split json endpoint", async () => {
    fetchMock.mockResolvedValue(mockFetchOk([{ wallet: "0xdef", amount: 1 }]));

    const response = await getDistributionAirdropsTeam(MEMES_CONTRACT, 123);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/distributions/${MEMES_CONTRACT}/123/team-airdrops`,
      expect.objectContaining({
        method: "GET",
        headers: {},
      })
    );
    expect(response).toEqual([{ wallet: "0xdef", amount: 1 }]);
  });
});
