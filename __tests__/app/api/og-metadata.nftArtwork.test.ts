jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://6529.test" },
}));

import { prepareNftArtworkImage } from "@/app/api/og-metadata/nfts/[contract]/[id]/artwork";

const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==",
    "base64"
  )
);
const model = {
  contract: "0xabc",
  id: "42",
  title: "Artwork",
  format: "portrait" as const,
  imageUrl: "https://cdn.test/art.png",
  origin: "https://6529.test",
};
const originalFetch = global.fetch;
const mockFetch = jest.fn();

const imageResponse = (bytes = png, headers: Record<string, string> = {}) => {
  const reader = {
    read: jest
      .fn()
      .mockResolvedValueOnce({ done: false, value: bytes })
      .mockResolvedValue({ done: true }),
    cancel: jest.fn().mockResolvedValue(undefined),
    releaseLock: jest.fn(),
  };
  return {
    ok: true,
    headers: new Headers({ "content-type": "image/png", ...headers }),
    body: { getReader: () => reader },
    reader,
  };
};

describe("NFT export artwork preparation", () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset().mockResolvedValue(imageResponse());
  });
  afterEach(() => jest.useRealTimers());
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("fetches only the safe proxy and embeds its PNG without a second image fetch", async () => {
    await expect(prepareNftArtworkImage(model)).resolves.toBe(
      `data:image/png;base64,${Buffer.from(png).toString("base64")}`
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://6529.test");
    expect(parsed.pathname).toBe("/api/og-metadata/image");
    expect(parsed.searchParams.get("url")).toBe(model.imageUrl);
    expect(parsed.searchParams.get("w")).toBe("960");
    expect(init.redirect).toBe("error");
  });

  it("also normalizes relative artwork through the safe proxy", async () => {
    await prepareNftArtworkImage({ ...model, imageUrl: "/art.png" });
    expect(new URL(mockFetch.mock.calls[0][0]).searchParams.get("url")).toBe(
      "https://6529.test/art.png"
    );
  });

  it.each([
    undefined,
    "https://localhost/a.png",
    "http://cdn.test/a.png",
    "https://127.0.0.1/a.png",
    "file:///art.png",
  ])(
    "rejects unavailable or unsafe artwork %s before fetching",
    async (imageUrl) => {
      await expect(
        prepareNftArtworkImage({ ...model, imageUrl })
      ).rejects.toThrow("unavailable");
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it.each(["text/html", "image/jpeg"])(
    "rejects %s instead of embedding a blank image",
    async (contentType) => {
      mockFetch.mockResolvedValue(
        imageResponse(png, { "content-type": contentType })
      );
      await expect(prepareNftArtworkImage(model)).rejects.toThrow(
        "could not be prepared"
      );
    }
  );

  it.each([new Uint8Array(), png.slice(0, -12), new Uint8Array(png.length)])(
    "rejects empty, truncated, or invalid PNG bytes",
    async (bytes) => {
      mockFetch.mockResolvedValue(imageResponse(bytes));
      await expect(prepareNftArtworkImage(model)).rejects.toThrow(
        "complete PNG"
      );
    }
  );

  it.each([
    [0, 1],
    [1201, 1],
    [1, 12001],
  ])(
    "rejects PNG dimensions %sx%s beyond proxy bounds",
    async (width, height) => {
      const bytes = png.slice();
      const view = new DataView(bytes.buffer);
      view.setUint32(16, width);
      view.setUint32(20, height);
      mockFetch.mockResolvedValue(imageResponse(bytes));
      await expect(prepareNftArtworkImage(model)).rejects.toThrow(
        "invalid dimensions"
      );
    }
  );

  it("rejects an oversized declared response before reading its body", async () => {
    const response = imageResponse(png, {
      "content-length": `${8 * 1024 * 1024 + 1}`,
    });
    mockFetch.mockResolvedValue(response);
    await expect(prepareNftArtworkImage(model)).rejects.toThrow("export limit");
    expect(response.reader.read).not.toHaveBeenCalled();
  });

  it("bounds streamed responses even when the size header is missing", async () => {
    const response = imageResponse(new Uint8Array(8 * 1024 * 1024 + 1));
    mockFetch.mockResolvedValue(response);
    await expect(prepareNftArtworkImage(model)).rejects.toThrow("export limit");
    expect(response.reader.cancel).toHaveBeenCalledTimes(1);
    expect(response.reader.releaseLock).toHaveBeenCalledTimes(1);
  });

  it("aborts pending fetches when the caller cancels", async () => {
    mockFetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const controller = new AbortController();
    const result = prepareNftArtworkImage(model, controller.signal);
    controller.abort();
    await expect(result).rejects.toThrow("aborted");
  });

  it("aborts artwork fetches after 25 seconds", async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const result = prepareNftArtworkImage(model);
    const assertion = expect(result).rejects.toThrow("aborted");
    await jest.advanceTimersByTimeAsync(25_000);
    await assertion;
  });
});
