import {
  createEmptyWaveMessages,
  fetchNewestWaveMessages,
  formatWaveMessages,
  maxOrNull,
  mergeDrops,
} from "@/contexts/wave/utils/wave-messages-utils";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiFetchWithRetry } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiFetchWithRetry: jest.fn(),
}));

const sampleDrop = {
  id: "drop-1",
  serial_no: 5,
  created_at: "2024-01-01T00:00:00Z",
  wave: { id: "wave-1" },
  parts: [],
  author: {},
  metadata: [],
};

const sampleIdentity = {
  id: "author-id",
  handle: "author",
  primary_address: "0xauthor",
  pfp: null,
  level: 1,
  classification: "PSEUDONYM",
  badges: {},
};

const sampleWaveOverview = {
  id: "wave-1",
  name: "Wave 1",
  pfp: null,
  last_drop_time: 100,
  is_private: false,
  context_profile_context: {
    can_chat: true,
    pinned: false,
  },
};

const sampleV2Drop = {
  id: "drop-1",
  serial_no: 5,
  created_at: 1000,
  updated_at: null,
  is_signed: false,
  hide_link_preview: false,
  title: "Drop 1",
  content: "Drop content",
  media: [],
  attachments: [],
  parts_count: 1,
  author: sampleIdentity,
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
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("formatWaveMessages", () => {
  it("decorates drops with stable keys and serial tracking", () => {
    const formatted = formatWaveMessages("wave-1", [sampleDrop as any]);
    expect(formatted.key).toBe("wave-1");
    const drop = formatted.drops?.[0];
    expect(drop).toBeDefined();
    expect(drop!).toMatchObject({
      id: "drop-1",
      type: DropSize.FULL,
    });
    expect(typeof drop!.stableKey).toBe("string");
    expect(drop!.stableKey).toBeTruthy();
    expect(drop!.stableHash).toBe(drop!.id);
    expect(formatted.latestFetchedSerialNo).toBe(5);
  });
});

describe("createEmptyWaveMessages", () => {
  it("returns an empty structure for a wave", () => {
    expect(createEmptyWaveMessages("wave-2")).toEqual({
      key: "wave-2",
      id: "wave-2",
      isLoading: false,
      isLoadingNextPage: false,
      hasNextPage: false,
      drops: [],
    });
  });
});

describe("mergeDrops", () => {
  it("prefers newer drops and keeps stable ordering", () => {
    const current = [
      {
        ...sampleDrop,
        serial_no: 4,
        created_at: "2023-12-31T23:59:59Z",
        stableKey: "existing",
        stableHash: "existing",
        type: DropSize.FULL,
      },
    ] as any[];
    const incoming = [
      {
        ...sampleDrop,
        id: "drop-2",
        serial_no: 6,
        created_at: "2024-01-02T00:00:00Z",
        type: DropSize.FULL,
      },
    ] as any[];

    const merged = mergeDrops(current, incoming);
    expect(merged[0]?.id).toBe("drop-2");
    expect(merged[0]?.serial_no).toBe(6);
  });

  it("orders temporary and canonical drops by created time consistently", () => {
    const current = [
      {
        ...sampleDrop,
        id: "temp-text",
        serial_no: 999_999_999,
        created_at: 1_000,
        stableKey: "temp-text",
        stableHash: "temp-text",
        type: DropSize.FULL,
      },
      {
        ...sampleDrop,
        id: "older-file",
        serial_no: 10,
        created_at: 500,
        stableKey: "older-file",
        stableHash: "older-file",
        type: DropSize.FULL,
      },
    ] as any[];
    const incoming = [
      {
        ...sampleDrop,
        id: "server-file",
        serial_no: 12,
        created_at: 2_000,
        type: DropSize.FULL,
      },
    ] as any[];

    const merged = mergeDrops(current, incoming);

    expect(merged.map((drop) => drop.id)).toEqual([
      "server-file",
      "temp-text",
      "older-file",
    ]);
  });

  it("falls back to serial number when created_at is null", () => {
    const current = [
      {
        ...sampleDrop,
        id: "null-created-at",
        serial_no: 20,
        created_at: null,
        stableKey: "null-created-at",
        stableHash: "null-created-at",
        type: DropSize.FULL,
      },
    ] as any[];
    const incoming = [
      {
        ...sampleDrop,
        id: "low-created-at",
        serial_no: 10,
        created_at: 5,
        type: DropSize.FULL,
      },
    ] as any[];

    const merged = mergeDrops(current, incoming);

    expect(merged.map((drop) => drop.id)).toEqual([
      "null-created-at",
      "low-created-at",
    ]);
  });
});

describe("fetchNewestWaveMessages", () => {
  it("fetches latest drops and annotates wave data", async () => {
    (commonApiFetchWithRetry as jest.Mock).mockResolvedValue({
      drops: [sampleV2Drop],
      wave: sampleWaveOverview,
    });

    const result = await fetchNewestWaveMessages("wave-1", null, 10);

    expect(commonApiFetchWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/waves/wave-1/drops",
        params: { limit: "10" },
        signal: undefined,
        retryOptions: expect.objectContaining({ maxRetries: 2 }),
      })
    );
    expect(result.drops?.[0]).toMatchObject({
      id: "drop-1",
      wave: { id: "wave-1", authenticated_user_admin: false },
    });
    expect(result.highestSerialNo).toBe(5);
  });

  it("returns null entries when request fails", async () => {
    const error = new Error("network");
    (commonApiFetchWithRetry as jest.Mock).mockRejectedValue(error);

    const result = await fetchNewestWaveMessages("wave-1", 10, 5);

    expect(result).toEqual({ drops: null, highestSerialNo: null });
  });
});

describe("maxOrNull", () => {
  it("returns the largest finite number", () => {
    expect(maxOrNull(1, 5)).toBe(5);
    expect(maxOrNull(undefined, null)).toBeNull();
  });
});
