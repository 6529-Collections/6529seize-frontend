jest.mock("undici", () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  fetch: jest.fn(),
}));

jest.mock("sharp", () => jest.fn());

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

import { dynamic, GET } from "@/app/api/og-metadata/image/route";
import { fetchPublicUrl } from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";
import sharp from "sharp";

const mockFetchPublicUrl = fetchPublicUrl as jest.Mock;
const mockSharp = jest.mocked(sharp);
const actualSharp = jest.requireActual<typeof sharp>("sharp");
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
  signal?: AbortSignal
): NextRequest =>
  ({
    signal,
    nextUrl: new URL(
      `http://localhost:3001/api/og-metadata/image?url=${encodeURIComponent(
        sourceUrl
      )}&w=${width}`
    ),
  }) as NextRequest;

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
    for (const body of [PNG_1X1, GIF_2_FRAME]) {
      mockImageResponse(body.byteLength, "application/octet-stream", body);
      const response = await GET(createRequest("https://cdn.test/art"));
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

  it("sniffs and rasterizes SVG without enlarging small artwork", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12"><rect width="24" height="12" fill="red"/></svg>'
    );
    mockImageResponse(svg.byteLength, "application/octet-stream", svg);

    const response = await GET(createRequest("https://cdn.test/art"));
    const metadata = await actualSharp(
      Buffer.from(await response.arrayBuffer())
    ).metadata();

    expect(response.status).toBe(200);
    expect(metadata).toMatchObject({ format: "png", width: 24, height: 12 });
  });

  it("preserves the GIF first-frame colors in a static PNG", async () => {
    mockImageResponse(GIF_2_FRAME.byteLength, "image/gif", GIF_2_FRAME);

    const response = await GET(createRequest("https://cdn.test/art.gif"));
    const output = actualSharp(Buffer.from(await response.arrayBuffer()));
    expect(await output.metadata()).toMatchObject({
      format: "png",
      width: 2,
      height: 2,
    });
    const { data, info } = await output
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([...data.subarray(0, 3)]).toEqual([255, 0, 0]);
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

  it("admits a waiting image after the active upstream request fails", async () => {
    let rejectFetch: (error: Error) => void = () => {
      throw new Error("Image fetch has not started.");
    };
    mockFetchPublicUrl.mockImplementationOnce(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectFetch = reject;
        })
    );
    const pending = GET(createRequest("https://cdn.test/pending.png"));
    mockImageResponse(PNG_1X1.byteLength);
    const waiting = GET(createRequest("https://cdn.test/another.png"));
    await Promise.resolve();

    try {
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
      expect(mockSharp).not.toHaveBeenCalled();
    } finally {
      rejectFetch(new Error("Upstream failed"));
      expect((await pending).status).toBe(502);
      expect((await waiting).status).toBe(200);
    }
  });

  it("normalizes simultaneous small images sequentially without overlapping downloads or decode", async () => {
    const image = actualSharp(PNG_1X1);
    const bufferOutput: { toBuffer: () => Promise<Buffer> } = image;
    const originalToBuffer = bufferOutput.toBuffer.bind(image);
    const workOrder: string[] = [];
    let finishProcessing: () => void = () => {
      throw new Error("Image processing has not started.");
    };
    let processingStarted: () => void = () => {
      throw new Error("Image processing wait has not started.");
    };
    const started = new Promise<void>((resolve) => {
      processingStarted = resolve;
    });
    const continueProcessing = new Promise<void>((resolve) => {
      finishProcessing = resolve;
    });
    jest.spyOn(bufferOutput, "toBuffer").mockImplementationOnce(async () => {
      workOrder.push("first-decode-start");
      processingStarted();
      await continueProcessing;
      const bytes = await originalToBuffer();
      workOrder.push("first-decode-complete");
      return bytes;
    });
    mockSharp.mockReturnValueOnce(image);
    mockImageResponse(PNG_1X1.byteLength);
    const pending = GET(createRequest("https://cdn.test/processing.png"));
    await started;
    mockFetchPublicUrl.mockImplementationOnce(async () => {
      workOrder.push("second-fetch");
      return {
        body: createReadableBody(PNG_1X1),
        headers: createHeaders({ "content-type": "image/png" }),
        ok: true,
        status: 200,
      };
    });
    const waiting = GET(createRequest("https://cdn.test/another.png"));
    await Promise.resolve();

    try {
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
      expect(mockSharp).toHaveBeenCalledTimes(1);
    } finally {
      finishProcessing();
      expect((await pending).status).toBe(200);
      const secondResponse = await waiting;
      expect(secondResponse.status).toBe(200);
      expect(
        await actualSharp(
          Buffer.from(await secondResponse.arrayBuffer())
        ).metadata()
      ).toMatchObject({ format: "png", width: 1, height: 1 });
    }
    expect(workOrder).toEqual([
      "first-decode-start",
      "first-decode-complete",
      "second-fetch",
    ]);
  });

  it("bounds pending image requests and removes aborted waiters before any download", async () => {
    let rejectFetch: (error: Error) => void = () => {
      throw new Error("Image fetch has not started.");
    };
    mockFetchPublicUrl.mockImplementationOnce(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectFetch = reject;
        })
    );
    const active = GET(createRequest("https://cdn.test/active.png"));
    const controllers = Array.from({ length: 32 }, () => new AbortController());
    const waiting = controllers.map((controller) =>
      GET(
        createRequest("https://cdn.test/queued.png", "1108", controller.signal)
      )
    );
    await Promise.resolve();

    try {
      const full = await GET(createRequest("https://cdn.test/full.png"));
      expect(full.status).toBe(503);
      expect(full.headers.get("cache-control")).toBe("no-store");
      expect(full.headers.get("retry-after")).toBe("1");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
      expect(mockSharp).not.toHaveBeenCalled();
    } finally {
      controllers.forEach((controller) => controller.abort());
      const responses = await Promise.all(waiting);
      expect(responses.every((response) => response.status === 503)).toBe(true);
      rejectFetch(new Error("Upstream failed"));
      expect((await active).status).toBe(502);
    }
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    mockImageResponse(PNG_1X1.byteLength);
    expect(
      (await GET(createRequest("https://cdn.test/retry.png"))).status
    ).toBe(200);
  });

  it("expires a queued image after 15 seconds without fetching it", async () => {
    jest.useFakeTimers();
    let rejectFetch: (error: Error) => void = () => {
      throw new Error("Image fetch has not started.");
    };
    mockFetchPublicUrl.mockImplementationOnce(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectFetch = reject;
        })
    );
    const active = GET(createRequest("https://cdn.test/active.png"));
    const waiting = GET(createRequest("https://cdn.test/queued.png"));
    await Promise.resolve();

    try {
      jest.advanceTimersByTime(15_000);
      const response = await waiting;
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("retry-after")).toBe("1");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
      expect(mockSharp).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      rejectFetch(new Error("Upstream failed"));
      await active;
      jest.useRealTimers();
    }
  });

  it("uses a bounded range request for oversized GIF previews", async () => {
    mockImageResponse(108 * 1024 * 1024, "image/gif");
    mockImageResponse(GIF_2_FRAME.byteLength, "image/gif", GIF_2_FRAME, 206);

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/large.gif")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
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
