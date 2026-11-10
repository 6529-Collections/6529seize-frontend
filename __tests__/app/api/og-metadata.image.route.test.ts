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
    const headers = init?.headers
      ? { ...init.headers, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    return new MockNextResponse(JSON.stringify(body), {
      ...init,
      headers,
    });
  }

  async json(): Promise<unknown> {
    if (typeof this.body !== "string") {
      throw new TypeError("Mock JSON response body must be a string.");
    }

    return JSON.parse(this.body);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (!(this.body instanceof Uint8Array)) {
      throw new TypeError("Mock binary response body must be a Uint8Array.");
    }

    return new Uint8Array(this.body).buffer;
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import type * as ImageRoute from "@/app/api/og-metadata/image/route";
import type { NextRequest } from "next/server";
import type sharp from "sharp";

// Each test loads a fresh route, so its in-memory result cache and admission
// queues never carry results or waiters from one case into the next.
let GET: typeof ImageRoute.GET;
let dynamic: typeof ImageRoute.dynamic;
let mockFetchPublicUrl: jest.Mock;
let mockSharp: jest.MockedFunctionDeep<typeof sharp>;
const actualSharp = jest.requireActual<typeof sharp>("sharp");

const loadRoute = () => {
  jest.isolateModules(() => {
    ({ GET, dynamic } =
      require("@/app/api/og-metadata/image/route") as typeof ImageRoute);
    mockFetchPublicUrl = (
      require("@/lib/security/urlGuard") as { fetchPublicUrl: jest.Mock }
    ).fetchPublicUrl;
    mockSharp = jest.mocked(require("sharp") as typeof sharp);
  });
};
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==",
  "base64"
);
const GIF_2_FRAME = Buffer.from(
  "R0lGODlhAgACAPAAAP8AAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQAAAAAACwAAAAAAgACAAACAoRRACH5BAAKAAAALAAAAAACAAIAgAAA/wAAAAIChFEAOw==",
  "base64"
);

const createRequest = (
  sourceUrl: string,
  width = "1108",
  signal: AbortSignal = new AbortController().signal
): NextRequest =>
  ({
    headers: new Headers(),
    signal,
    nextUrl: new URL(
      `http://localhost:3001/api/og-metadata/image?url=${encodeURIComponent(
        sourceUrl
      )}&w=${width}`
    ),
  }) as NextRequest;

// Upstream fetches admitted at once, and callers that may wait for one.
const FETCH_SLOTS = 4;
const FETCH_QUEUE = 256;

/** Makes the next `count` upstream fetches hang until the returned call. */
const holdUpstreams = (count: number): (() => void) => {
  const rejecters: Array<(error: Error) => void> = [];
  for (let index = 0; index < count; index++) {
    mockFetchPublicUrl.mockImplementationOnce(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejecters.push(reject);
        })
    );
  }
  return () => {
    rejecters.forEach((reject) => reject(new Error("Upstream failed")));
  };
};

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const createReadableBody = (buffer: Buffer) => {
  let hasRead = false;
  const cancel = jest.fn();
  return {
    cancel,
    getReader: () => ({
      cancel,
      read: jest.fn(async () => {
        if (hasRead) {
          return { done: true, value: undefined };
        }
        hasRead = true;
        return { done: false, value: new Uint8Array(buffer) };
      }),
      releaseLock: jest.fn(),
    }),
  };
};

const createHeaders = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? null,
});

const mockImageResponse = (
  contentLength: number,
  contentType = "image/png",
  body = PNG_1X1,
  status = 200
): jest.Mock => {
  const responseBody = createReadableBody(body);
  mockFetchPublicUrl.mockResolvedValueOnce({
    body: responseBody,
    headers: {
      get: createHeaders({
        "content-length": `${contentLength}`,
        "content-type": contentType,
      }).get,
    },
    ok: status >= 200 && status < 300,
    status,
  });
  return responseBody.cancel;
};

describe("/api/og-metadata/image", () => {
  beforeEach(() => {
    loadRoute();
    mockFetchPublicUrl.mockReset();
    mockSharp.mockReset().mockImplementation(actualSharp);
  });

  it("is always rendered at request time", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("normalizes source images up to 50 MiB for drop OG previews", async () => {
    mockImageResponse(50 * 1024 * 1024);

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/drop.png")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
  });

  it("still rejects source images above the proxy cap", async () => {
    const cancel = mockImageResponse(51 * 1024 * 1024);

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/huge.png")
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to normalize image",
    });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels unsuccessful upstream responses", async () => {
    const cancel = mockImageResponse(
      0,
      "text/html",
      Buffer.from("Missing"),
      404
    );

    const response = await GET(createRequest("https://cdn.test/missing.png"));

    expect(response.status).toBe(502);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("applies a finite pixel limit and first-frame selection to every Sharp input", async () => {
    for (const [index, body] of [PNG_1X1, GIF_2_FRAME].entries()) {
      mockImageResponse(body.byteLength, "application/octet-stream", body);
      const response = await GET(
        createRequest(`https://cdn.test/art-${index}`)
      );
      expect(response.status).toBe(200);
    }

    expect(mockSharp).toHaveBeenCalledTimes(2);
    for (const [, options] of mockSharp.mock.calls) {
      expect(options).toEqual({
        limitInputPixels: 512_000_000,
        page: 0,
        pages: 1,
        sequentialRead: true,
      });
    }
  });

  it.each([
    { width: 32_001, height: 16_000 },
    { width: 65_537, height: 1 },
    { width: 1, height: 65_537 },
    { width: 0, height: 1 },
    { width: 1, height: Number.NaN },
    { width: Number.POSITIVE_INFINITY, height: 1 },
    { width: 1.5, height: 1 },
  ])(
    "rejects unsupported decoded dimensions before processing: %j",
    async (dimensions) => {
      const image = actualSharp(PNG_1X1);
      const metadata = await image.metadata();
      jest
        .spyOn(image, "metadata")
        .mockResolvedValue({ ...metadata, ...dimensions });
      const toBuffer = jest.spyOn(image, "toBuffer");
      mockSharp.mockReturnValueOnce(image);
      mockImageResponse(PNG_1X1.byteLength);

      const response = await GET(createRequest("https://cdn.test/art.png"));

      expect(response.status).toBe(502);
      expect(toBuffer).not.toHaveBeenCalled();
    }
  );

  it.each([
    { width: 32_000, height: 16_000 },
    { width: 65_536, height: 1 },
    { width: 1, height: 65_536 },
    { width: 32_000, height: 160_000, pageHeight: 16_000, pages: 10 },
  ])(
    "allows boundary dimensions per processed frame without allocating them: %j",
    async (dimensions) => {
      const image = actualSharp(PNG_1X1);
      const metadata = await image.metadata();
      jest
        .spyOn(image, "metadata")
        .mockResolvedValue({ ...metadata, ...dimensions });
      const timeout = jest.spyOn(image, "timeout");
      const resize = jest.spyOn(image, "resize");
      mockSharp.mockReturnValueOnce(image);
      mockImageResponse(PNG_1X1.byteLength);

      const response = await GET(
        createRequest("https://cdn.test/art.png", "9999")
      );

      expect(response.status).toBe(200);
      expect(timeout).toHaveBeenCalledWith({ seconds: 7 });
      expect(resize).toHaveBeenCalledWith(1200, 12000, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }
  );

  it("rejects a tiny PNG whose header declares more than the decoded pixel budget", async () => {
    // Valid IHDR CRC for 32,001 x 16,000; keep the tiny original IDAT because
    // the decoder must reject the dimensions before it processes pixel data.
    const oversizedHeader = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAfQEAAD6ACAYAAAAHE8IPAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==",
      "base64"
    );
    await expect(
      actualSharp(oversizedHeader, {
        limitInputPixels: 512_000_000,
        pages: 1,
      }).metadata()
    ).rejects.toThrow("Input image exceeds pixel limit");
    mockImageResponse(oversizedHeader.byteLength, "image/png", oversizedHeader);

    const response = await GET(createRequest("https://cdn.test/art.png"));

    expect(response.status).toBe(502);
  });

  it("disables Sharp's SVG loader for the process", () => {
    expect(mockSharp.block).toHaveBeenCalledWith({
      operation: ["VipsForeignLoadSvg"],
    });
  });

  it.each([
    [
      "SVG",
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12"><rect width="24" height="12" fill="red"/></svg>',
      "image/svg+xml",
    ],
    [
      "XML",
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>',
      "application/octet-stream",
    ],
  ])(
    "rejects %s documents without decoding them",
    async (_label, document, contentType) => {
      const svg = Buffer.from(document);
      mockImageResponse(svg.byteLength, contentType, svg);

      const response = await GET(createRequest("https://cdn.test/art.svg"));

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to normalize image",
      });
      expect(mockSharp).not.toHaveBeenCalled();
    }
  );

  it("preserves ordinary external GIF animation only when explicitly requested", async () => {
    mockImageResponse(GIF_2_FRAME.byteLength, "image/gif", GIF_2_FRAME);
    const request = createRequest("https://cdn.test/art.gif");
    request.nextUrl.searchParams.set("animated", "1");
    const response = await GET(request);
    const metadata = await actualSharp(
      Buffer.from(await response.arrayBuffer()),
      { animated: true }
    ).metadata();
    expect(response.headers.get("content-type")).toBe("image/gif");
    expect(metadata).toMatchObject({ width: 2, pageHeight: 2, pages: 2 });
    const original = await actualSharp(GIF_2_FRAME, {
      animated: true,
    }).metadata();
    expect(metadata.delay).toEqual(original.delay);
    expect(metadata.loop).toBe(original.loop);
  });

  it("keeps a first-frame preview when external animation exceeds the decoded budget", async () => {
    const image = actualSharp(GIF_2_FRAME);
    const metadata = await image.metadata();
    jest
      .spyOn(image, "metadata")
      .mockResolvedValue({ ...metadata, pages: 100_000_000 });
    mockSharp.mockReturnValueOnce(image);
    mockImageResponse(GIF_2_FRAME.byteLength, "image/gif", GIF_2_FRAME);
    const request = createRequest("https://cdn.test/art.gif");
    request.nextUrl.searchParams.set("animated", "1");
    const response = await GET(request);
    expect(response.status).toBe(200);
    // An opaque first frame is a JPEG still.
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(mockSharp).toHaveBeenCalledTimes(1);
  });

  it("preserves the GIF first-frame colors in a static still", async () => {
    mockImageResponse(GIF_2_FRAME.byteLength, "image/gif", GIF_2_FRAME);

    const response = await GET(createRequest("https://cdn.test/art.gif"));
    const output = actualSharp(Buffer.from(await response.arrayBuffer()));
    expect(await output.metadata()).toMatchObject({
      format: "jpeg",
      width: 2,
      height: 2,
    });
    const { data, info } = await output
      .raw()
      .toBuffer({ resolveWithObject: true });
    // JPEG is lossy: the first pixel stays red within a small tolerance.
    const [red = 0, green = 255, blue = 255] = data.subarray(0, 3);
    expect(red).toBeGreaterThan(240);
    expect(green).toBeLessThan(16);
    expect(blue).toBeLessThan(16);
    expect(info.width).toBe(2);
  });

  it.each([
    {
      inputWidth: 2,
      inputHeight: 24_000,
      width: "1200",
      outputWidth: 1,
      outputHeight: 12_000,
    },
    {
      inputWidth: 2400,
      inputHeight: 2,
      width: "9999",
      outputWidth: 1200,
      outputHeight: 1,
    },
    {
      inputWidth: 240,
      inputHeight: 120,
      width: "60",
      outputWidth: 60,
      outputHeight: 30,
    },
  ])(
    "resizes inside both output bounds while preserving aspect ratio: %j",
    async ({ inputWidth, inputHeight, width, outputWidth, outputHeight }) => {
      const png = await actualSharp({
        create: {
          width: inputWidth,
          height: inputHeight,
          channels: 3,
          background: "red",
        },
      })
        .png()
        .toBuffer();
      mockImageResponse(png.byteLength, "image/png", png);

      const response = await GET(
        createRequest("https://cdn.test/art.png", width)
      );

      expect(response.status).toBe(200);
      const metadata = await actualSharp(
        Buffer.from(await response.arrayBuffer())
      ).metadata();
      expect(metadata).toMatchObject({
        width: outputWidth,
        height: outputHeight,
      });
    }
  );

  it("applies EXIF rotation before fitting the output bounds", async () => {
    const jpeg = await actualSharp({
      create: { width: 60, height: 30, channels: 3, background: "red" },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    mockImageResponse(jpeg.byteLength, "image/jpeg", jpeg);

    const response = await GET(createRequest("https://cdn.test/art.jpg", "15"));

    expect(response.status).toBe(200);
    expect(
      await actualSharp(Buffer.from(await response.arrayBuffer())).metadata()
    ).toMatchObject({
      width: 15,
      height: 30,
    });
  });

  it("keeps fetching and decoding other images while one upstream is slow", async () => {
    const releaseSlow = holdUpstreams(1);
    const slow = GET(createRequest("https://cdn.test/slow.png"));
    mockImageResponse(PNG_1X1.byteLength);

    try {
      const fast = await GET(createRequest("https://cdn.test/fast.png"));
      expect(fast.status).toBe(200);
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
      expect(mockSharp).toHaveBeenCalledTimes(1);
    } finally {
      releaseSlow();
      expect((await slow).status).toBe(502);
    }
  });

  it("decodes at most three images at once while later images download", async () => {
    let decodesStarted = 0;
    let openGate: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    mockSharp.mockImplementation(((
      input?: Parameters<typeof sharp>[0],
      options?: Parameters<typeof sharp>[1]
    ) => {
      const image = actualSharp(input, options);
      const output: { toBuffer: () => Promise<Buffer> } = image;
      const originalToBuffer = output.toBuffer.bind(image);
      jest.spyOn(output, "toBuffer").mockImplementation(async () => {
        decodesStarted += 1;
        await gate;
        return originalToBuffer();
      });
      return image;
    }) as typeof sharp);
    mockFetchPublicUrl.mockImplementation(async () => ({
      body: createReadableBody(PNG_1X1),
      headers: createHeaders({ "content-type": "image/png" }),
      ok: true,
      status: 200,
    }));

    const responses = Array.from({ length: 4 }, (_value, index) =>
      GET(createRequest(`https://cdn.test/decode-${index}.png`))
    );
    // Sharp reads metadata on its own threads before the encode starts.
    for (let tries = 0; tries < 200 && decodesStarted < 3; tries++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // All four downloaded; the fourth waits for a decode slot.
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(4);
      expect(decodesStarted).toBe(3);
      expect(mockSharp).toHaveBeenCalledTimes(3);
    } finally {
      openGate();
    }
    const settled = await Promise.all(responses);
    expect(settled.every((response) => response.status === 200)).toBe(true);
    expect(mockSharp).toHaveBeenCalledTimes(4);
  });

  it("encodes opaque stills as JPEG and keeps PNG for images with transparency", async () => {
    const opaque = await actualSharp({
      create: {
        width: 4,
        height: 3,
        channels: 3,
        background: { r: 200, g: 40, b: 40 },
      },
    })
      .png()
      .toBuffer();
    const transparent = await actualSharp({
      create: {
        width: 4,
        height: 3,
        channels: 4,
        background: { r: 200, g: 40, b: 40, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
    mockImageResponse(opaque.byteLength, "image/png", opaque);
    mockImageResponse(transparent.byteLength, "image/png", transparent);

    const still = await GET(createRequest("https://cdn.test/opaque.png"));
    expect(still.status).toBe(200);
    expect(still.headers.get("content-type")).toBe("image/jpeg");
    expect(
      await actualSharp(Buffer.from(await still.arrayBuffer())).metadata()
    ).toMatchObject({ format: "jpeg", width: 4, height: 3 });

    const alpha = await GET(createRequest("https://cdn.test/transparent.png"));
    expect(alpha.status).toBe(200);
    expect(alpha.headers.get("content-type")).toBe("image/png");
    expect(
      await actualSharp(Buffer.from(await alpha.arrayBuffer())).metadata()
    ).toMatchObject({ format: "png", hasAlpha: true });
  });

  it("keeps an opaque still lossless as PNG when format=png is asked for, and caches it apart from the default", async () => {
    const opaque = await actualSharp({
      create: {
        width: 4,
        height: 3,
        channels: 3,
        background: { r: 20, g: 120, b: 220 },
      },
    })
      .png()
      .toBuffer();
    mockImageResponse(opaque.byteLength, "image/png", opaque);
    mockImageResponse(opaque.byteLength, "image/png", opaque);

    const lossless = createRequest("https://cdn.test/artwork.png", "960");
    lossless.nextUrl.searchParams.set("format", "png");
    lossless.nextUrl.searchParams.set("animated", "1");
    const png = await GET(lossless);
    expect(png.status).toBe(200);
    expect(png.headers.get("content-type")).toBe("image/png");
    expect(
      await actualSharp(Buffer.from(await png.arrayBuffer())).metadata()
    ).toMatchObject({ format: "png", width: 4, height: 3 });

    const inline = await GET(
      createRequest("https://cdn.test/artwork.png", "960")
    );
    expect(inline.headers.get("content-type")).toBe("image/jpeg");
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
  });

  it("refuses an unknown output format before fetching", async () => {
    const request = createRequest("https://cdn.test/artwork.png");
    request.nextUrl.searchParams.set("format", "webp");
    const response = await GET(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported format",
    });
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
  });

  it("finishes and caches an admitted image after every caller has left", async () => {
    let deliver: () => void = () => undefined;
    mockFetchPublicUrl.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          deliver = () =>
            resolve({
              body: createReadableBody(PNG_1X1),
              headers: createHeaders({ "content-type": "image/png" }),
              ok: true,
              status: 200,
            });
        })
    );
    const controller = new AbortController();
    const abandoned = GET(
      createRequest("https://cdn.test/slow-host.png", "1108", controller.signal)
    );
    await settle();
    controller.abort();
    expect((await abandoned).status).toBe(503);

    // Wait for the admitted job to finish its encode, then for it to store.
    let encoded: () => void = () => undefined;
    const encodeDone = new Promise<void>((resolve) => {
      encoded = resolve;
    });
    mockSharp.mockImplementationOnce(((
      input?: Parameters<typeof sharp>[0],
      options?: Parameters<typeof sharp>[1]
    ) => {
      const image = actualSharp(input, options);
      const output: { toBuffer: () => Promise<Buffer> } = image;
      const originalToBuffer = output.toBuffer.bind(image);
      jest.spyOn(output, "toBuffer").mockImplementation(async () => {
        const bytes = await originalToBuffer();
        encoded();
        return bytes;
      });
      return image;
    }) as typeof sharp);
    deliver();
    await encodeDone;
    await settle();

    const later = await GET(createRequest("https://cdn.test/slow-host.png"));
    expect(later.status).toBe(200);
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockSharp).toHaveBeenCalledTimes(1);
  });

  it("bounds pending image requests and removes aborted waiters before any download", async () => {
    const releaseSlow = holdUpstreams(FETCH_SLOTS);
    const active = Array.from({ length: FETCH_SLOTS }, (_value, index) =>
      GET(createRequest(`https://cdn.test/active-${index}.png`))
    );
    const controllers = Array.from(
      { length: FETCH_QUEUE },
      () => new AbortController()
    );
    const waiting = controllers.map((controller, index) =>
      GET(
        createRequest(
          `https://cdn.test/queued-${index}.png`,
          "1108",
          controller.signal
        )
      )
    );
    await settle();

    try {
      const full = await GET(createRequest("https://cdn.test/full.png"));
      expect(full.status).toBe(503);
      expect(full.headers.get("cache-control")).toBe("no-store");
      expect(full.headers.get("retry-after")).toBe("1");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(FETCH_SLOTS);
      expect(mockSharp).not.toHaveBeenCalled();
    } finally {
      controllers.forEach((controller) => controller.abort());
      const responses = await Promise.all(waiting);
      expect(responses.every((response) => response.status === 503)).toBe(true);
      releaseSlow();
      const activeResponses = await Promise.all(active);
      expect(activeResponses.every((response) => response.status === 502)).toBe(
        true
      );
    }
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(FETCH_SLOTS);
    mockImageResponse(PNG_1X1.byteLength);
    expect(
      (await GET(createRequest("https://cdn.test/retry.png"))).status
    ).toBe(200);
  });

  it("expires a queued image after 15 seconds without fetching it", async () => {
    jest.useFakeTimers();
    const releaseSlow = holdUpstreams(FETCH_SLOTS);
    const active = Array.from({ length: FETCH_SLOTS }, (_value, index) =>
      GET(createRequest(`https://cdn.test/active-${index}.png`))
    );
    const waiting = GET(createRequest("https://cdn.test/queued.png"));
    await Promise.resolve();

    try {
      jest.advanceTimersByTime(15_000);
      const response = await waiting;
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("retry-after")).toBe("1");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(FETCH_SLOTS);
      expect(mockSharp).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      releaseSlow();
      await Promise.all(active);
      jest.useRealTimers();
    }
  });

  it("limits each client however it varies the width or query string", async () => {
    const fromClient = (index: number) =>
      ({
        headers: new Headers({ "x-forwarded-for": "8.8.8.8" }),
        signal: new AbortController().signal,
        nextUrl: new URL(
          `http://localhost:3001/api/og-metadata/image?url=${encodeURIComponent(
            `https://cdn.test/cached.png?v=${index % 2}`
          )}&w=${(index % 2) + 600}&n=${index}`
        ),
      }) as NextRequest;
    mockFetchPublicUrl.mockImplementation(async () => ({
      body: createReadableBody(PNG_1X1),
      headers: createHeaders({ "content-type": "image/png" }),
      ok: true,
      status: 200,
    }));

    for (let index = 0; index < 3000; index++) {
      expect((await GET(fromClient(index))).status).toBe(200);
    }
    const limited = await GET(fromClient(3000));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toEqual(expect.any(String));
    await expect(limited.json()).resolves.toEqual({
      error: "Too many image requests",
    });

    // Another client keeps its own budget.
    const other = await GET({
      ...createRequest("https://cdn.test/cached.png"),
      headers: new Headers({ "x-forwarded-for": "1.1.1.1" }),
    } as NextRequest);
    expect(other.status).toBe(200);
  });

  it("uses a static bounded range preview even when animation is requested", async () => {
    mockImageResponse(108 * 1024 * 1024, "image/gif");
    mockImageResponse(GIF_2_FRAME.byteLength, "image/gif", GIF_2_FRAME, 206);

    const request = createRequest(
      "https://d3lqz0a4bldqgf.cloudfront.net/large.gif"
    );
    request.nextUrl.searchParams.set("animated", "1");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    expect(mockFetchPublicUrl.mock.calls[1]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        range: "bytes=0-8388607",
      }),
    });
  });

  it("rejects oversized GIF range responses when the upstream ignores Range", async () => {
    mockImageResponse(108 * 1024 * 1024, "image/gif");
    const cancelRangeBody = mockImageResponse(
      GIF_2_FRAME.byteLength,
      "image/gif",
      GIF_2_FRAME,
      200
    );

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/large.gif")
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to normalize image",
    });
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    expect(cancelRangeBody).toHaveBeenCalledTimes(1);
  });

  it("cancels oversized GIF range responses before rejecting their content length", async () => {
    mockImageResponse(108 * 1024 * 1024, "image/gif");
    const cancelRangeBody = mockImageResponse(
      9 * 1024 * 1024,
      "image/gif",
      GIF_2_FRAME,
      206
    );

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/large.gif")
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to normalize image",
    });
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    expect(cancelRangeBody).toHaveBeenCalledTimes(1);
  });

  it("keeps invalid media urls as JSON errors", async () => {
    const response = await GET(createRequest("http://localhost/secret.png"));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Invalid image url",
    });
  });
});
