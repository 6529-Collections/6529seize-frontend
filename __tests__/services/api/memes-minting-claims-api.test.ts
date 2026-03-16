import { MEMES_CONTRACT } from "@/constants/constants";
import {
  getDistributionAirdropsArtist,
  getDistributionAirdropsTeam,
  getMemesMintingClaimActions,
  getMemesMintingClaimActionTypes,
  upsertMemesMintingClaimAction,
} from "@/services/api/memes-minting-claims-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: jest.fn(),
  getAuthJwt: jest.fn(),
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
