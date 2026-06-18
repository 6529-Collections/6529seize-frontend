jest.mock("undici", () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  fetch: jest.fn(),
}));

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
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import { GET } from "@/app/api/og-metadata/image/route";
import { fetchPublicUrl } from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";

const mockFetchPublicUrl = fetchPublicUrl as jest.Mock;
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);
const GIF_2_FRAME = Buffer.from(
  "R0lGODlhAgACAPAAAP8AAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQAAAAAACwAAAAAAgACAAACAoRRACH5BAAKAAAALAAAAAACAAIAgAAA/wAAAAIChFEAOw==",
  "base64"
);

const createRequest = (sourceUrl: string): NextRequest =>
  ({
    nextUrl: new URL(
      `http://localhost:3001/api/og-metadata/image?url=${encodeURIComponent(
        sourceUrl
      )}&w=1108`
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
    mockImageResponse(51 * 1024 * 1024);

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/huge.png")
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to normalize image",
    });
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
