import {
  fetchWaveMessages,
  fetchAroundSerialNoWaveMessages,
} from "@/contexts/wave/utils/wave-messages-utils";
import {
  WAVE_DROPS_NATIVE_INITIAL_PARAMS,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import {
  commonApiFetch,
  commonApiFetchWithRetry,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api");

const drop = {
  id: "d1",
  serial_no: 1,
  created_at: 1000,
  updated_at: null,
  is_signed: false,
  hide_link_preview: false,
  title: "Drop",
  content: "Drop content",
  media: [],
  attachments: [],
  parts_count: 1,
  author: {
    id: "author-id",
    handle: "author",
    primary_address: "0xauthor",
    pfp: null,
    level: 1,
    classification: "PSEUDONYM",
    badges: {},
  },
  drop_type: "CHAT",
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  nft_links: [],
  reactions: [],
  boosts: 0,
  context_profile_context: {
    reaction: null,
    boosted: false,
    bookmarked: false,
  },
} as any;

const wave = {
  id: "w",
  name: "Wave",
  pfp: null,
  last_drop_time: 100,
  is_private: false,
  context_profile_context: {
    can_chat: true,
    pinned: false,
  },
};

const mockFetch = commonApiFetch as jest.Mock;
const mockFetchRetry = commonApiFetchWithRetry as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("wave-messages-utils additional", () => {
  it("fetchWaveMessages returns mapped drops", async () => {
    mockFetch.mockResolvedValue({ drops: [drop], wave });
    const res = await fetchWaveMessages("w", null);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/w/drops",
        params: {
          limit: WAVE_DROPS_PARAMS.limit.toString(),
          respect_drop_reply_collapse: "true",
        },
      })
    );
    expect(res?.[0]?.wave).toEqual(expect.objectContaining({ id: "w" }));
  });

  it("fetchWaveMessages accepts an initial limit override", async () => {
    mockFetch.mockResolvedValue({ drops: [drop], wave });
    await fetchWaveMessages("w", null, undefined, undefined, {
      limit: WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/w/drops",
        params: {
          limit: WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit.toString(),
          respect_drop_reply_collapse: "true",
        },
      })
    );
  });

  it("fetchWaveMessages rethrows abort errors", async () => {
    const err = new DOMException("aborted", "AbortError");
    mockFetch.mockRejectedValue(err);
    await expect(fetchWaveMessages("w", null)).rejects.toBe(err);
  });

  it("fetchWaveMessages reports non-abort failures before returning null", async () => {
    const err = Object.assign(new Error("Service unavailable"), {
      status: 503,
    });
    const onFailure = jest.fn();
    mockFetch.mockRejectedValue(err);

    const result = await fetchWaveMessages("w", null, undefined, undefined, {
      onFailure,
    });

    expect(result).toBeNull();
    expect(onFailure).toHaveBeenCalledWith(err);
  });

  it("fetchAroundSerialNoWaveMessages uses retry fetch", async () => {
    mockFetchRetry.mockResolvedValue({ drops: [drop], wave });
    const res = await fetchAroundSerialNoWaveMessages("w", 5);
    expect(mockFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/w/drops",
        params: expect.objectContaining({
          limit: WAVE_DROPS_PARAMS.limit.toString(),
          serial_no_limit: "5",
          search_strategy: "FIND_BOTH",
          respect_drop_reply_collapse: "true",
        }),
      })
    );
    expect(res?.[0]?.serial_no).toBe(1);
  });
});
