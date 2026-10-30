jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
const mockAnonymousSsrFetch = jest.fn();
jest.mock("@/lib/fetch/ssrFetch", () => ({
  anonymousSsrFetch: (...args: unknown[]) => mockAnonymousSsrFetch(...args),
}));

import {
  fetchPublicWaveDrop,
  PUBLIC_WAVE_DROP_PART_LIMIT,
} from "@/app/waves/public-wave-drop.server";

const selection = { key: "drop", value: "old-drop" } as const;
const visible = { status: "VISIBLE", can_view: true };
const response = () => ({
  wave: {
    id: "wave-1",
    name: "Public wave",
    is_private: false,
    is_dm_wave: false,
  },
  drop: {
    id: "old-drop",
    serial_no: 42,
    parts_count: 1,
    created_at: 1750000000000,
    title: "**Selected title**",
    content: "Selected old post",
    moderation: visible,
    author: { handle: "artist", primary_address: "0x123", private: "secret" },
    context_profile_context: { secret: "viewer-only" },
    media: [{ url: "https://example.com/art.png", mime_type: "image/png" }],
  },
});
const resolve = (data: unknown) =>
  mockAnonymousSsrFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });

describe("selected public Wave drop", () => {
  beforeEach(() => jest.resetAllMocks());

  it("fetches the selected drop anonymously and serializes only public fields", async () => {
    resolve(response());
    const result = await fetchPublicWaveDrop("wave-1", selection);
    expect(mockAnonymousSsrFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/drops/old-drop"),
      { cache: "no-store" }
    );
    expect(result).toMatchObject({
      id: "old-drop",
      title: "Selected title",
      author: "artist",
      publishedAt: "2025-06-15T15:06:40.000Z",
      href: "/waves/wave-1?drop=old-drop",
      parts: [
        {
          partNo: 1,
          text: "Selected old post",
          media: [
            { url: "https://example.com/art.png", mimeType: "image/png" },
          ],
        },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(
      /secret|viewer-only|context_profile_context/
    );
  });

  it("resolves serial links through the collection before fetching Wave metadata", async () => {
    resolve({ data: [response().drop], page: 1, next: false });
    resolve(response());
    expect(
      await fetchPublicWaveDrop("wave-1", { key: "serialNo", value: "42" })
    ).toMatchObject({ href: "/waves/wave-1?serialNo=42" });
    expect(mockAnonymousSsrFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/v2/drops?serial_nos=42&page_size=1"),
      { cache: "no-store" }
    );
    expect(mockAnonymousSsrFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/v2/drops/old-drop"),
      { cache: "no-store" }
    );
    expect(mockAnonymousSsrFetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    { data: [] },
    { data: [{ ...response().drop, serial_no: 43 }] },
    {
      data: [
        {
          ...response().drop,
          moderation: { status: "VISIBLE", can_view: false },
        },
      ],
    },
  ])(
    "omits serial previews when the lookup has no visible match: %p",
    async (page) => {
      resolve({ ...page, page: 1, next: false });
      expect(
        await fetchPublicWaveDrop("wave-1", { key: "serialNo", value: "42" })
      ).toBeNull();
      expect(mockAnonymousSsrFetch).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    { drop: { ...response().drop, serial_no: 43 } },
    { drop: { ...response().drop, id: "another-drop" } },
    {
      drop: {
        ...response().drop,
        moderation: { status: "VISIBLE", can_view: false },
      },
    },
    { wave: { ...response().wave, id: "another-wave" } },
    { wave: { ...response().wave, is_private: true } },
    { wave: { ...response().wave, is_dm_wave: true } },
  ])(
    "rechecks identity and visibility after serial resolution: %p",
    async (change) => {
      resolve({ data: [response().drop], page: 1, next: false });
      resolve({ ...response(), ...change });
      expect(
        await fetchPublicWaveDrop("wave-1", { key: "serialNo", value: "42" })
      ).toBeNull();
    }
  );

  it.each([
    { key: "drop", value: "" },
    { key: "serialNo", value: "42junk" },
    { key: "serialNo", value: "-1" },
  ] as const)("does not request an invalid selection %p", async (input) => {
    expect(await fetchPublicWaveDrop("wave-1", input)).toBeNull();
    expect(mockAnonymousSsrFetch).not.toHaveBeenCalled();
  });

  it.each([
    { is_private: true },
    { is_dm_wave: true },
    { is_private: undefined },
    { is_dm_wave: undefined },
    { id: "another-wave" },
    { name: "" },
  ])("fails closed for an inaccessible or mismatched wave %p", async (wave) => {
    const data = response();
    resolve({ ...data, wave: { ...data.wave, ...wave } });
    expect(await fetchPublicWaveDrop("wave-1", selection)).toBeNull();
  });

  it.each([
    { moderation: undefined },
    { moderation: { status: "VISIBLE", can_view: false } },
    { moderation: { status: "AI_QUARANTINED", can_view: true } },
    { id: "another-drop" },
    { created_at: 1e20 },
    { created_at: null },
    { parts_count: -1 },
    { parts_count: 1.5 },
    { author: { primary_address: "" } },
  ])("fails closed for unsafe or invalid drop data %p", async (drop) => {
    const data = response();
    resolve({ ...data, drop: { ...data.drop, ...drop } });
    expect(await fetchPublicWaveDrop("wave-1", selection)).toBeNull();
  });

  it("preserves long post text while removing markup and unsafe media links", async () => {
    const data = response();
    resolve({
      ...data,
      drop: {
        ...data.drop,
        content: `**Hello** ${"x".repeat(600)} <img src=x onerror=alert(1)>`,
        media: [
          { url: "javascript:alert(1)", mime_type: "image/png" },
          { url: "data:text/html,hello", mime_type: "text/html" },
          { url: "https://user:pass@example.com/a", mime_type: "image/png" },
          {
            url: "https://example.com/pending.png",
            mime_type: "image/png",
            media_status: "processing",
          },
          {
            url: "https://example.com/movie.mp4",
            mime_type: "video/mp4",
            media_status: "ready",
          },
        ],
      },
    });
    const result = await fetchPublicWaveDrop("wave-1", selection);
    expect(result?.parts[0]?.text).toBe(`Hello ${"x".repeat(600)}`);
    expect(result?.parts[0]?.media).toEqual([
      { url: "https://example.com/movie.mp4", mimeType: "video/mp4" },
    ]);
  });

  it("includes storm parts in order and bounds the request count", async () => {
    const data = response();
    resolve({ ...data, drop: { ...data.drop, parts_count: 100 } });
    for (let partNo = 2; partNo <= PUBLIC_WAVE_DROP_PART_LIMIT; partNo++) {
      resolve({
        part_no: partNo,
        content: `Part ${partNo}`,
        moderation: visible,
      });
    }
    const result = await fetchPublicWaveDrop("wave-1", selection);
    expect(result?.parts).toHaveLength(PUBLIC_WAVE_DROP_PART_LIMIT);
    expect(result?.parts[1]?.text).toBe("Part 2");
    expect(result?.hasMoreParts).toBe(true);
    expect(mockAnonymousSsrFetch).toHaveBeenCalledTimes(
      PUBLIC_WAVE_DROP_PART_LIMIT
    );
  });

  it("emits no storm preview if an additional part is hidden", async () => {
    const data = response();
    resolve({ ...data, drop: { ...data.drop, parts_count: 2 } });
    resolve({
      part_no: 2,
      content: "hidden",
      moderation: { status: "VISIBLE", can_view: false },
    });
    expect(await fetchPublicWaveDrop("wave-1", selection)).toBeNull();
  });

  it.each([401, 403, 404, 500])(
    "omits the preview for HTTP %i",
    async (status) => {
      mockAnonymousSsrFetch.mockResolvedValue({ ok: false, status });
      expect(await fetchPublicWaveDrop("wave-1", selection)).toBeNull();
    }
  );

  it("contains transport and malformed-response failures", async () => {
    mockAnonymousSsrFetch.mockRejectedValueOnce(new Error("private detail"));
    expect(await fetchPublicWaveDrop("wave-1", selection)).toBeNull();
    resolve({});
    expect(await fetchPublicWaveDrop("wave-1", selection)).toBeNull();
  });
});
