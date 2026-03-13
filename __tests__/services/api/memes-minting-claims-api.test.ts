import { MEMES_CONTRACT } from "@/constants/constants";
import {
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
global.fetch = fetchMock;

describe("memes-minting-claims-api", () => {
  const encodedContract = encodeURIComponent(MEMES_CONTRACT);

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    (getStagingAuth as jest.Mock).mockReturnValue(null);
    (getAuthJwt as jest.Mock).mockReturnValue(null);
  });

  it("fetches supported MEMES claim action types", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        contract: MEMES_CONTRACT,
        action_types: ["ARTIST_AIRDROP", "TEAM_AIRDROP"],
      }),
    });

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
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        contract: MEMES_CONTRACT,
        claim_id: 123,
        actions: [{ action: "ARTIST_AIRDROP", completed: false }],
      }),
    });

    const response = await getMemesMintingClaimActions(123);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/minting-claims/actions/${encodedContract}/123`,
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(response.actions).toHaveLength(1);
    expect(response.actions[0].action).toBe("ARTIST_AIRDROP");
  });

  it("upserts a MEMES claim action", async () => {
    (getAuthJwt as jest.Mock).mockReturnValue("jwt");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        contract: MEMES_CONTRACT,
        claim_id: 123,
        actions: [{ action: "ARTIST_AIRDROP", completed: true }],
      }),
    });

    const response = await upsertMemesMintingClaimAction(123, {
      action: "ARTIST_AIRDROP",
      completed: true,
    });

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
    expect(response.actions[0].completed).toBe(true);
  });
});
