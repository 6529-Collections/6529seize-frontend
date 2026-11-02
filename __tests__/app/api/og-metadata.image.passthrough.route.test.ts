jest.mock("undici", () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  fetch: jest.fn(),
}));

// The route blocks a libvips loader for the whole process at import. Keep that
// on the mock: the native block would outlive this file inside the worker.
jest.mock("sharp", () => Object.assign(jest.fn(), { block: jest.fn() }));

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    fetchPublicUrl: jest.fn(),
  };
});

class MockNextResponse {
  readonly body: BodyInit | null;
  readonly headers: { get: (name: string) => string | null };
  readonly status: number;

  constructor(body: BodyInit | null, init?: ResponseInit) {
    const headerValues = new Map<string, string>();
    Object.entries(init?.headers ?? {}).forEach(([key, value]) => {
      headerValues.set(key.toLowerCase(), `${value}`);
    });
    this.body = body;
    this.headers = {
      get: (name: string) => headerValues.get(name.toLowerCase()) ?? null,
    };
    this.status = init?.status ?? 200;
  }

  static json(body: unknown, init?: ResponseInit): MockNextResponse {
    return new MockNextResponse(JSON.stringify(body), {
      ...init,
      headers: { ...init?.headers, "Content-Type": "application/json" },
    });
  }

  async json(): Promise<unknown> {
    if (typeof this.body !== "string") {
      throw new TypeError("Mock JSON response body must be a string.");
    }
    return JSON.parse(this.body);
  }

  bytes(): Buffer {
    if (!(this.body instanceof Uint8Array)) {
      throw new TypeError("Mock binary response body must be a Uint8Array.");
    }
    return Buffer.from(this.body);
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import { GIPHY_MEDIA_HOSTS } from "@/app/api/og-metadata/_lib/giphyRenditions";
import type * as ImageRoute from "@/app/api/og-metadata/image/route";
import type * as UrlGuard from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";
import type sharp from "sharp";

let GET: typeof ImageRoute.GET;
let mockFetchPublicUrl: jest.Mock;
// The real guard from the route's own module registry, so its errors match.
let realFetchPublicUrl: typeof UrlGuard.fetchPublicUrl;
let mockSharp: jest.MockedFunctionDeep<typeof sharp>;
const actualSharp = jest.requireActual<typeof sharp>("sharp");

const GIPHY_MP4 =
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/88EhKlGzXuhBfStCds/giphy.mp4";
// A minimal ISO BMFF header: box size, then the `ftyp` box type.
const MP4_BYTES = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from("ftypisom", "latin1"),
  Buffer.alloc(20, 0x2a),
]);
const GIF_2_FRAME = Buffer.from(
  "R0lGODlhAgACAPAAAP8AAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQAAAAAACwAAAAAAgACAAACAoRRACH5BAAKAAAALAAAAAACAAIAgAAA/wAAAAIChFEAOw==",
  "base64"
);
const LONG_CACHE_CONTROL =
  "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000";

const createRequest = (
  sourceUrl: string,
  {
    params = {},
    range,
    signal = new AbortController().signal,
  }: {
    readonly params?: Record<string, string>;
    readonly range?: string;
    readonly signal?: AbortSignal;
  } = {}
): NextRequest => {
  const url = new URL("http://localhost:3001/api/og-metadata/image");
  url.searchParams.set("url", sourceUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return {
    signal,
    nextUrl: url,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "range" ? (range ?? null) : null,
    },
  } as unknown as NextRequest;
};

const videoRequest = (
  sourceUrl = GIPHY_MP4,
  options: { readonly range?: string } = {}
) => createRequest(sourceUrl, { ...options, params: { format: "mp4" } });

const mockUpstream = ({
  body,
  contentType,
  contentLength = body.byteLength,
  status = 200,
}: {
  readonly body: Buffer;
  readonly contentType: string;
  readonly contentLength?: number | null;
  readonly status?: number;
}): jest.Mock => {
  let hasRead = false;
  const cancel = jest.fn();
  const headers: Record<string, string> = { "content-type": contentType };
  if (contentLength !== null) {
    headers["content-length"] = `${contentLength}`;
  }
  mockFetchPublicUrl.mockResolvedValueOnce({
    body: {
      cancel,
      getReader: () => ({
        cancel,
        read: jest.fn(async () => {
          if (hasRead) {
            return { done: true, value: undefined };
          }
          hasRead = true;
          return { done: false, value: new Uint8Array(body) };
        }),
        releaseLock: jest.fn(),
      }),
    },
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    ok: status >= 200 && status < 300,
    status,
  });
  return cancel;
};

const mockGiphyVideo = () =>
  mockUpstream({ body: MP4_BYTES, contentType: "video/mp4" });

describe("/api/og-metadata/image", () => {
  beforeEach(() => {
    jest.isolateModules(() => {
      ({ GET } =
        require("@/app/api/og-metadata/image/route") as typeof ImageRoute);
      mockFetchPublicUrl = (
        require("@/lib/security/urlGuard") as { fetchPublicUrl: jest.Mock }
      ).fetchPublicUrl;
      mockSharp = jest.mocked(require("sharp") as typeof sharp);
      realFetchPublicUrl = jest.requireActual<typeof UrlGuard>(
        "@/lib/security/urlGuard"
      ).fetchPublicUrl;
    });
    mockFetchPublicUrl.mockReset();
    mockSharp.mockReset().mockImplementation(actualSharp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Giphy MP4 pass-through", () => {
    it("passes the rendition through unchanged with long cache headers", async () => {
      mockGiphyVideo();

      const response = await GET(videoRequest());

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("video/mp4");
      expect(response.headers.get("accept-ranges")).toBe("bytes");
      expect(response.headers.get("cache-control")).toBe(LONG_CACHE_CONTROL);
      expect(response.headers.get("content-length")).toBe(
        `${MP4_BYTES.byteLength}`
      );
      expect((response as unknown as MockNextResponse).bytes()).toEqual(
        MP4_BYTES
      );
      expect(mockSharp).not.toHaveBeenCalled();
      expect(mockFetchPublicUrl).toHaveBeenCalledWith(
        new URL(GIPHY_MP4),
        { headers: { accept: "video/mp4" } },
        expect.objectContaining({
          timeoutMs: 7000,
          policy: { allowedHosts: GIPHY_MEDIA_HOSTS },
        })
      );
    });

    it.each([
      ["bytes=0-1", 206, 0, 1],
      ["bytes=30-", 206, 30, 31],
      ["bytes=-4", 206, 28, 31],
      ["bytes=8-999", 206, 8, 31],
    ])(
      "serves the byte range %s for media elements",
      async (range, status, start, end) => {
        mockGiphyVideo();

        const response = await GET(videoRequest(GIPHY_MP4, { range }));

        expect(response.status).toBe(status);
        expect(response.headers.get("content-range")).toBe(
          `bytes ${start}-${end}/${MP4_BYTES.byteLength}`
        );
        expect(response.headers.get("content-length")).toBe(
          `${end - start + 1}`
        );
        expect((response as unknown as MockNextResponse).bytes()).toEqual(
          MP4_BYTES.subarray(start, end + 1)
        );
      }
    );

    it.each(["bytes=32-", "bytes=-0"])(
      "answers the unsatisfiable range %s with 416",
      async (range) => {
        mockGiphyVideo();

        const response = await GET(videoRequest(GIPHY_MP4, { range }));

        expect(response.status).toBe(416);
        expect(response.headers.get("content-range")).toBe(
          `bytes */${MP4_BYTES.byteLength}`
        );
      }
    );

    it.each(["bytes=5-3", "bytes=0-1,4-5", "items=0-1"])(
      "ignores the unusable range %s and serves the whole file",
      async (range) => {
        mockGiphyVideo();

        const response = await GET(videoRequest(GIPHY_MP4, { range }));

        expect(response.status).toBe(200);
        expect(response.headers.get("content-range")).toBeNull();
      }
    );

    it("serves repeated and ranged requests from one upstream fetch", async () => {
      mockGiphyVideo();

      expect((await GET(videoRequest())).status).toBe(200);
      const ranged = await GET(videoRequest(GIPHY_MP4, { range: "bytes=0-1" }));

      expect(ranged.status).toBe(206);
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    });

    it.each([
      "https://cdn.test/media/abc123/giphy.mp4",
      "https://media5.giphy.com/media/abc123/giphy.mp4",
      "https://media1.giphy.com/media/abc123/giphy.gif",
      "https://media1.giphy.com/media/abc123/giphy.mp4?cid=1",
      "https://media1.giphy.com/media/abc123/giphy-preview.mp4",
    ])("refuses %s before any upstream request", async (sourceUrl) => {
      const response = await GET(videoRequest(sourceUrl));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Unsupported video url",
      });
      expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    });

    it.each(["image/gif", "text/html", "application/octet-stream"])(
      "refuses an upstream %s response without reading it",
      async (contentType) => {
        const cancel = mockUpstream({ body: MP4_BYTES, contentType });

        const response = await GET(videoRequest());

        expect(response.status).toBe(502);
        expect(cancel).toHaveBeenCalledTimes(1);
      }
    );

    it("refuses a declared size above 8 MB without reading it", async () => {
      const cancel = mockUpstream({
        body: MP4_BYTES,
        contentType: "video/mp4",
        contentLength: 8 * 1024 * 1024 + 1,
      });

      const response = await GET(videoRequest());

      expect(response.status).toBe(502);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("stops reading an undeclared body once it passes 8 MB", async () => {
      const oversized = Buffer.concat([
        MP4_BYTES,
        Buffer.alloc(8 * 1024 * 1024),
      ]);
      const cancel = mockUpstream({
        body: oversized,
        contentType: "video/mp4",
        contentLength: null,
      });

      const response = await GET(videoRequest());

      expect(response.status).toBe(502);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it("refuses bytes that are not an MP4 even when labelled video/mp4", async () => {
      mockUpstream({ body: GIF_2_FRAME, contentType: "video/mp4" });

      const response = await GET(videoRequest());

      expect(response.status).toBe(502);
    });

    it("refuses an unsuccessful upstream answer", async () => {
      const cancel = mockUpstream({
        body: Buffer.from("Missing"),
        contentType: "video/mp4",
        status: 404,
      });

      const response = await GET(videoRequest());

      expect(response.status).toBe(502);
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("result cache", () => {
    it("serves an identical image request from memory", async () => {
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      const request = () =>
        createRequest("https://cdn.test/art.gif#frame", {
          params: { animated: "1", w: "800" },
        });

      const first = await GET(request());
      const second = await GET(request());

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.headers.get("content-type")).toBe("image/gif");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    });

    it("keys results by width and animation mode", async () => {
      for (let request = 0; request < 3; request++) {
        mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      }

      await GET(
        createRequest("https://cdn.test/art.gif", { params: { w: "800" } })
      );
      await GET(
        createRequest("https://cdn.test/art.gif", { params: { w: "1200" } })
      );
      await GET(
        createRequest("https://cdn.test/art.gif", {
          params: { w: "800", animated: "1" },
        })
      );

      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(3);
    });

    it("shares one fetch and decode between concurrent identical requests", async () => {
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });

      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          GET(createRequest("https://cdn.test/popular.gif"))
        )
      );

      expect(responses.map((response) => response.status)).toEqual([
        200, 200, 200, 200, 200,
      ]);
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
      expect(mockSharp).toHaveBeenCalledTimes(1);
    });

    it("holds an upstream failure for only 5 seconds", async () => {
      let now = 1_000_000;
      jest.spyOn(Date, "now").mockImplementation(() => now);
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      mockUpstream({
        body: Buffer.from("Bad gateway"),
        contentType: "text/html",
        status: 502,
      });
      const request = () => createRequest("https://cdn.test/blip.gif");

      expect((await GET(request())).status).toBe(502);
      now += 4_999;
      expect((await GET(request())).status).toBe(502);
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);

      now += 1;
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      expect((await GET(request())).status).toBe(200);
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    });

    it("keeps a failure to process the image for 30 seconds", async () => {
      let now = 1_000_000;
      jest.spyOn(Date, "now").mockImplementation(() => now);
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      mockUpstream({
        body: Buffer.from("<html></html>"),
        contentType: "text/html",
      });
      const request = () => createRequest("https://cdn.test/not-an-image.gif");

      expect((await GET(request())).status).toBe(502);
      now += 29_999;
      const cached = await GET(request());
      expect(cached.status).toBe(502);
      await expect(cached.json()).resolves.toEqual({
        error: "Failed to normalize image",
      });
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);

      now += 1;
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      expect((await GET(request())).status).toBe(200);
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    });

    it("lets identical queued requests share one admission slot and never caches busy answers", async () => {
      let rejectFetch: (error: Error) => void = () => {
        throw new Error("Image fetch has not started.");
      };
      mockFetchPublicUrl.mockImplementationOnce(
        () =>
          new Promise<Response>((_resolve, reject) => {
            rejectFetch = reject;
          })
      );
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      const active = GET(createRequest("https://cdn.test/active.png"));
      const shared = Array.from({ length: 40 }, () =>
        GET(createRequest("https://cdn.test/shared.png"))
      );
      const others = Array.from({ length: 31 }, (_value, index) =>
        GET(createRequest(`https://cdn.test/other-${index}.png`))
      );
      await Promise.resolve();

      // 40 identical waiters hold one slot, so 31 more fill the queue of 32.
      const full = await GET(createRequest("https://cdn.test/full.png"));
      expect(full.status).toBe(503);
      expect(full.headers.get("cache-control")).toBe("no-store");

      rejectFetch(new Error("Upstream failed"));
      for (let index = 0; index < 32; index++) {
        mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      }
      expect((await active).status).toBe(502);
      const sharedResponses = await Promise.all(shared);
      expect(sharedResponses.every((response) => response.status === 200)).toBe(
        true
      );
      await Promise.all(others);
      // 1 active + 1 shared + 31 others; the busy answer was not cached.
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(33);
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      expect(
        (await GET(createRequest("https://cdn.test/full.png"))).status
      ).toBe(200);
    });
  });

  describe("URL guard on the image path", () => {
    it.each([
      "https://127.0.0.1/secret.png",
      "https://169.254.169.254/latest/meta-data.gif",
      "https://10.0.0.8/internal.gif",
    ])(
      "refuses the private host %s with the same guard options as before",
      async (sourceUrl) => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        mockFetchPublicUrl.mockImplementation(realFetchPublicUrl);

        const response = await GET(
          createRequest(sourceUrl, { params: { animated: "1" } })
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
          error: "Unsupported image host",
        });
        expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
        // The image path passes exactly the options it passed before this change.
        expect(mockFetchPublicUrl.mock.calls[0]?.[2]).toEqual({
          timeoutMs: 7000,
          userAgent:
            "Mozilla/5.0 (compatible; 6529-og-image/1.0; +https://6529.io)",
        });
        expect(mockSharp).not.toHaveBeenCalled();
      }
    );
  });

  describe("animated re-encode safety net", () => {
    const failAnimatedEncodes = () => {
      mockSharp.mockImplementation(((
        input?: Parameters<typeof sharp>[0],
        options?: Parameters<typeof sharp>[1]
      ) => {
        const image = actualSharp(input, options);
        if (options?.animated) {
          jest
            .spyOn(image, "toBuffer")
            .mockRejectedValue(new Error("timeout: 7s exceeded"));
        }
        return image;
      }) as typeof sharp);
    };

    it("serves the first frame briefly instead of a 502 when the animation fails", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => undefined);
      failAnimatedEncodes();
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });

      const response = await GET(
        createRequest("https://cdn.test/slow.gif", {
          params: { animated: "1", w: "800" },
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(response.headers.get("cache-control")).toBe("public, max-age=300");
      expect(
        await actualSharp(
          (response as unknown as MockNextResponse).bytes()
        ).metadata()
      ).toMatchObject({ format: "png", width: 2, height: 2 });
    });

    it("retries the animation after the five-minute stand-in expires", async () => {
      let now = 2_000_000;
      jest.spyOn(Date, "now").mockImplementation(() => now);
      jest.spyOn(console, "warn").mockImplementation(() => undefined);
      failAnimatedEncodes();
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      const request = () =>
        createRequest("https://cdn.test/slow.gif", {
          params: { animated: "1" },
        });

      await GET(request());
      now += 5 * 60 * 1000 - 1;
      await GET(request());
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);

      now += 1;
      mockSharp.mockImplementation(actualSharp);
      mockUpstream({ body: GIF_2_FRAME, contentType: "image/gif" });
      const animated = await GET(request());
      expect(animated.headers.get("content-type")).toBe("image/gif");
      expect(animated.headers.get("cache-control")).toBe(LONG_CACHE_CONTROL);
    });
  });
});
