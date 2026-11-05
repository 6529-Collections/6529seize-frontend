/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });

const image = Buffer.from("RIFF0000WEBPimage");
let getPack: typeof import("@/lib/e2ee/emoji-pack.server").getE2eeEmojiPack;
let fetchMock: jest.Mock;

beforeEach(async () => {
  jest.resetModules();
  fetchMock = jest.fn(
    async (url: string) =>
      new Response(
        url.endsWith(".json") ? JSON.stringify(["gm", "6529spin"]) : image
      )
  );
  globalThis.fetch = fetchMock;
  getPack = (await import("@/lib/e2ee/emoji-pack.server")).getE2eeEmojiPack;
});

it("fetches the whole catalog once, deduplicates concurrent requests and caches inline images", async () => {
  const [a, b] = await Promise.all([getPack(), getPack()]);
  expect(a).toEqual(
    ["gm", "6529spin"].map((id) => ({
      id,
      src: `data:image/webp;base64,${image.toString("base64")}`,
    }))
  );
  expect(a).toBe(b);
  expect(await getPack()).toBe(a);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/emoji-list.json",
    "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/gm.webp",
    "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/6529spin.webp",
  ]);
});

it("never publishes a partial pack and permits recovery after an upstream failure", async () => {
  fetchMock.mockImplementationOnce(
    async () => new Response("unavailable", { status: 503 })
  );
  await expect(getPack()).rejects.toThrow();
  await expect(getPack()).resolves.toHaveLength(2);
});

it.each([
  { catalog: [] },
  { catalog: ["../track"] },
  { catalog: ["https://example.com/image"] },
  { catalog: Array.from({ length: 201 }, () => "gm") },
])(
  "rejects an invalid catalog before fetching images: $catalog",
  async ({ catalog }) => {
    fetchMock.mockImplementationOnce(
      async () => new Response(JSON.stringify(catalog))
    );
    await expect(getPack()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
);

it.each([
  { mime: "image/jpeg", bytes: Buffer.from([255, 216, 255, 0]) },
  { mime: "image/png", bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) },
  { mime: "image/gif", bytes: Buffer.from("GIF89a") },
])(
  "preserves $mime images even when the catalog filename ends with .webp",
  async ({ mime, bytes }) => {
    fetchMock.mockImplementation(
      async (url: string) =>
        new Response(url.endsWith(".json") ? '["gm"]' : bytes)
    );
    await expect(getPack()).resolves.toEqual([
      { id: "gm", src: `data:${mime};base64,${bytes.toString("base64")}` },
    ]);
  }
);

it("rejects non-raster and oversized assets", async () => {
  fetchMock.mockImplementation(
    async (url: string) =>
      new Response(url.endsWith(".json") ? '["gm"]' : "not a WebP")
  );
  await expect(getPack()).rejects.toThrow("Invalid emoji image");
  fetchMock.mockImplementation(
    async (url: string) =>
      new Response(
        url.endsWith(".json") ? '["gm"]' : Buffer.alloc(1024 * 1024 + 1)
      )
  );
  await expect(getPack()).rejects.toThrow("Emoji asset too large");
});
