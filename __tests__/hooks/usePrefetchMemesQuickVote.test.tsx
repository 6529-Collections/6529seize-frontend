import {
  fetchMemesQuickVoteUndiscoveredDrop,
  getMemesQuickVoteUndiscoveredDropQueryKey,
  MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
} from "@/hooks/memesQuickVote.query";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

describe("memesQuickVote undiscovered-drop query helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a stable query key for each quick-vote discovery slot", () => {
    expect(
      getMemesQuickVoteUndiscoveredDropQueryKey({
        contextProfile: "alice",
        proxyId: "proxy-1",
        sessionId: 7,
        skip: 2,
        waveId: "memes-wave",
      })
    ).toEqual([
      MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
      {
        context_profile: "alice",
        proxyId: "proxy-1",
        sessionId: 7,
        skip: 2,
        waveId: "memes-wave",
      },
    ]);
  });

  it("fetches the first undiscovered drop without a skip parameter", async () => {
    const response = {
      drop: null,
      left_to_vote_in_current_round: 0,
      total_count: 0,
    };
    const signal = new AbortController().signal;
    commonApiFetchMock.mockResolvedValueOnce(response as any);

    await expect(
      fetchMemesQuickVoteUndiscoveredDrop({
        signal,
        skip: 0,
        waveId: "memes-wave",
      })
    ).resolves.toBe(response);

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/memes-wave/undiscovered-drop",
      params: undefined,
      signal,
    });
  });

  it("fetches lookahead undiscovered drops with a skip parameter", async () => {
    const response = {
      drop: null,
      left_to_vote_in_current_round: 0,
      total_count: 0,
    };
    commonApiFetchMock.mockResolvedValueOnce(response as any);

    await fetchMemesQuickVoteUndiscoveredDrop({
      skip: 3,
      waveId: "memes-wave",
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/memes-wave/undiscovered-drop",
      params: { skip: "3" },
      signal: undefined,
    });
  });

  it("rejects when no memes wave id is available", async () => {
    await expect(
      fetchMemesQuickVoteUndiscoveredDrop({
        skip: 0,
        waveId: null,
      })
    ).rejects.toThrow("Memes quick vote undiscovered drop requires a wave id");

    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });
});
