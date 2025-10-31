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
    expect(merged[0].id).toBe("drop-2");
    expect(merged[0].serial_no).toBe(6);
  });
});

describe("fetchNewestWaveMessages", () => {
  it("fetches latest drops and annotates wave data", async () => {
    (commonApiFetchWithRetry as jest.Mock).mockResolvedValue({
      drops: [sampleDrop],
      wave: { id: "wave-1", authenticated_user_admin: true },
    });

    const result = await fetchNewestWaveMessages("wave-1", null, 10);

    expect(commonApiFetchWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "waves/wave-1/drops",
        params: { limit: "10" },
        signal: undefined,
        retryOptions: expect.objectContaining({ maxRetries: 2 }),
      })
    );
    expect(result.drops?.[0]).toMatchObject({
      id: "drop-1",
      wave: { authenticated_user_admin: true },
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
