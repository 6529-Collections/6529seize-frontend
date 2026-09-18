jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

const mockAnonymousSsrFetch = jest.fn();

jest.mock("@/lib/fetch/ssrFetch", () => ({
  anonymousSsrFetch: (...args: unknown[]) => mockAnonymousSsrFetch(...args),
}));

import {
  fetchPublicWaveFeed,
  PUBLIC_WAVE_FEED_LIMIT,
  PUBLIC_WAVE_FEED_REQUEST_LIMIT,
} from "@/app/waves/public-wave-feed.server";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";

const makeDrop = (
  serialNo: number,
  overrides: Record<string, unknown> = {}
) => ({
  id: `drop-${serialNo}`,
  serial_no: serialNo,
  created_at: 1_750_000_000_000 + serialNo,
  title: `Drop ${serialNo}`,
  content: `Public content ${serialNo}`,
  author: {
    handle: `artist-${serialNo}`,
    primary_address: `0x${serialNo}`,
    context_profile_context: { private: "viewer-only" },
  },
  moderation: {
    status: ApiDropModerationStatus.Visible,
    can_view: true,
  },
  viewer_context: { private: "viewer-only" },
  ...overrides,
});

const makeFeed = (overrides: Record<string, unknown> = {}) => ({
  wave: {
    id: "wave-1",
    name: "Public Wave",
    is_private: false,
    is_dm_wave: false,
    context_profile_context: { private: "viewer-only" },
  },
  drops: [makeDrop(1)],
  trace: [{ secret: "upstream-trace" }],
  ...overrides,
});

describe("fetchPublicWaveFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const resolveFeed = (feed: unknown) =>
    mockAnonymousSsrFetch.mockResolvedValue({
      json: async () => feed,
      ok: true,
    } as Response);

  it("fetches a bounded anonymous page and returns only the strict public DTO", async () => {
    resolveFeed(
      makeFeed({
        drops: Array.from(
          { length: PUBLIC_WAVE_FEED_REQUEST_LIMIT },
          (_, index) => makeDrop(index + 1)
        ),
      })
    );

    const result = await fetchPublicWaveFeed("wave-1");

    expect(PUBLIC_WAVE_FEED_REQUEST_LIMIT).toBe(PUBLIC_WAVE_FEED_LIMIT + 1);
    expect(mockAnonymousSsrFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `/api/v2/waves/wave-1/drops?limit=${PUBLIC_WAVE_FEED_LIMIT + 1}`
      ),
      { cache: "no-store" }
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        waveId: "wave-1",
        waveName: "Public Wave",
        hasMore: true,
      })
    );
    if (!result.ok) {
      throw new Error("Expected a public feed result");
    }
    expect(result.items).toHaveLength(PUBLIC_WAVE_FEED_LIMIT);
    expect(result.items[0]).toEqual({
      id: "drop-1",
      serialNo: 1,
      createdAt: 1_750_000_000_001,
      authorLabel: "artist-1",
      title: "Drop 1",
      excerpt: "Public content 1",
      href: "/waves/wave-1?drop=drop-1",
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("viewer-only");
    expect(serialized).not.toContain("upstream-trace");
    expect(serialized).not.toContain("context_profile_context");
    expect(serialized).not.toContain("viewer_context");
  });

  it("fails closed when the response wave identity or privacy is ambiguous", async () => {
    for (const wave of [
      {
        id: "other-wave",
        name: "Public Wave",
        is_private: false,
        is_dm_wave: false,
      },
      {
        id: "wave-1",
        name: "Public Wave",
        is_private: true,
        is_dm_wave: false,
      },
      {
        id: "wave-1",
        name: "Public Wave",
        is_private: false,
        is_dm_wave: true,
      },
      { id: "wave-1", name: "Public Wave", is_dm_wave: false },
    ]) {
      mockAnonymousSsrFetch.mockResolvedValueOnce({
        json: async () => makeFeed({ wave }),
        ok: true,
      } as Response);
      await expect(fetchPublicWaveFeed("wave-1")).resolves.toEqual({
        ok: false,
        waveId: "wave-1",
      });
    }
  });

  it("includes only drops whose moderation is explicitly visible and viewable", async () => {
    resolveFeed(
      makeFeed({
        drops: [
          makeDrop(1),
          makeDrop(2, { moderation: undefined }),
          makeDrop(3, {
            moderation: {
              status: ApiDropModerationStatus.AiQuarantined,
              can_view: true,
            },
          }),
          makeDrop(4, {
            moderation: {
              status: ApiDropModerationStatus.Visible,
              can_view: false,
            },
          }),
        ],
      })
    );

    const result = await fetchPublicWaveFeed("wave-1");

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        items: [expect.objectContaining({ id: "drop-1" })],
      })
    );
  });

  it("normalizes and bounds user-authored text", async () => {
    resolveFeed(
      makeFeed({
        drops: [
          makeDrop(1, {
            title: " **Public title** ",
            content: `<script>unsafe</script> [Visible link](https://example.com) ${"x".repeat(400)}`,
          }),
        ],
      })
    );

    const result = await fetchPublicWaveFeed("wave-1");
    if (!result.ok) {
      throw new Error("Expected a public feed result");
    }

    expect(result.items[0]?.title).toBe("Public title");
    expect(result.items[0]?.excerpt).not.toContain("<script>");
    expect(result.items[0]?.excerpt).not.toContain("https://example.com");
    expect(result.items[0]?.excerpt?.length).toBeLessThanOrEqual(281);
  });

  it("returns an opaque unavailable result when the anonymous upstream fails", async () => {
    mockAnonymousSsrFetch.mockRejectedValue(
      new Error("private upstream detail")
    );

    const result = await fetchPublicWaveFeed("wave-1");

    expect(result).toEqual({ ok: false, waveId: "wave-1" });
    expect(JSON.stringify(result)).not.toContain("private upstream detail");
  });
});
