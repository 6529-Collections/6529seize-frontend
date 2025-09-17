import {
  fetchArtBlocksMeta,
  inferSeries,
} from "@/src/services/api/artblocks";

const originalFetch = global.fetch;

describe("inferSeries", () => {
  it("defaults to Engine when contract present", () => {
    expect(inferSeries("0xabc" as `0x${string}`)).toBe("Engine");
  });

  it("defaults to Curated without contract", () => {
    expect(inferSeries(undefined)).toBe("Curated");
  });
});

describe("fetchArtBlocksMeta", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("parses metadata payloads", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        project_name: "Chromie Squiggle",
        artist: "Snowfro",
        tokenID: "0",
        features: { Type: "Normal", Height: "3" },
        platform: "Art Blocks Curated",
        aspect_ratio: 1.5,
      }),
    });

    const meta = await fetchArtBlocksMeta({ tokenId: "0" });

    expect(meta).toEqual(
      expect.objectContaining({
        projectName: "Chromie Squiggle",
        artistName: "Snowfro",
        tokenNumber: "0",
        series: "Curated",
        aspectRatio: 1.5,
      })
    );
    expect(meta?.features).toEqual({ Type: "Normal", Height: "3" });
  });

  it("returns null on 4xx responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const meta = await fetchArtBlocksMeta({ tokenId: "1" });
    expect(meta).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("serves cached data within TTL and revalidates after expiry", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T00:00:00Z"));

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ project_name: "First" }),
    });

    const first = await fetchArtBlocksMeta({ tokenId: "42" });
    expect(first?.projectName).toBe("First");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockClear();

    const second = await fetchArtBlocksMeta({ tokenId: "42" });
    expect(second?.projectName).toBe("First");
    expect(mockFetch).not.toHaveBeenCalled();

    jest.setSystemTime(new Date("2023-01-02T02:00:00Z"));
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ project_name: "Second" }),
    });

    const third = await fetchArtBlocksMeta({ tokenId: "42" });
    expect(third?.projectName).toBe("First");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    await Promise.resolve();

    const fourth = await fetchArtBlocksMeta({ tokenId: "42" });
    expect(fourth?.projectName).toBe("Second");
  });
});
