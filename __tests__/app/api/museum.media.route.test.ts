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
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import { dynamic, GET } from "@/app/api/museum/media/route";
import { UrlGuardError, fetchPublicUrl } from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";

const mockFetchPublicUrl = fetchPublicUrl as jest.Mock;
const SOURCE =
  "https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.003/6529NM-W-0029/c1b6541832f2a237555adffae2f4870143a976549e591e2dbaa4d3d87f75d166/webp-v2-q82-m6-fixed-icc/640.webp";
const SMALL_WEBP = Buffer.from([0x52, 0x49, 0x46, 0x46]);

function createRequest(sourceUrl: string): NextRequest {
  return {
    nextUrl: new URL(
      `http://localhost:3001/api/museum/media?url=${encodeURIComponent(sourceUrl)}`
    ),
  } as NextRequest;
}

function createReadableBody(chunks: readonly Uint8Array[]) {
  let index = 0;
  const cancel = jest.fn();
  return {
    cancel,
    getReader: () => ({
      cancel,
      read: jest.fn(async () => {
        const value = chunks[index];
        index += 1;
        return value === undefined
          ? { done: true, value: undefined }
          : { done: false, value };
      }),
      releaseLock: jest.fn(),
    }),
  };
}

function mockResponse({
  body = createReadableBody([new Uint8Array(SMALL_WEBP)]),
  contentLength = `${SMALL_WEBP.byteLength}`,
  contentType = "image/webp",
  ok = true,
  status = 200,
  url = SOURCE,
}: {
  body?: ReturnType<typeof createReadableBody> | null;
  contentLength?: string | null;
  contentType?: string;
  ok?: boolean;
  status?: number;
  url?: string;
} = {}) {
  const values = new Map<string, string>();
  if (contentLength !== null) values.set("content-length", contentLength);
  values.set("content-type", contentType);
  mockFetchPublicUrl.mockResolvedValueOnce({
    body,
    headers: { get: (name: string) => values.get(name.toLowerCase()) ?? null },
    ok,
    status,
    url,
  });
  return body;
}

describe("/api/museum/media", () => {
  beforeEach(() => {
    mockFetchPublicUrl.mockReset();
  });

  it("is rendered at request time and returns immutable WebP bytes", async () => {
    mockResponse();

    const response = await GET(createRequest(SOURCE));

    expect(dynamic).toBe("force-dynamic");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(mockFetchPublicUrl).toHaveBeenCalledWith(
      new URL(SOURCE),
      { headers: { accept: "image/webp" } },
      expect.objectContaining({ timeoutMs: 8_000 })
    );
  });

  it("rejects unsupported source and redirected URLs", async () => {
    const invalid = await GET(createRequest("https://example.com/image.webp"));
    expect(invalid.status).toBe(400);
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();

    mockResponse({ url: SOURCE.replace("/640.webp", "/private.webp") });
    const redirected = await GET(createRequest(SOURCE));
    expect(redirected.status).toBe(400);
  });

  it("rejects upstream failures, missing bodies, and non-WebP content", async () => {
    mockResponse({ ok: false, status: 503 });
    expect((await GET(createRequest(SOURCE))).status).toBe(502);

    mockResponse({ body: null });
    expect((await GET(createRequest(SOURCE))).status).toBe(502);

    mockResponse({ contentType: "text/html" });
    expect((await GET(createRequest(SOURCE))).status).toBe(415);
  });

  it("rejects declared and streamed bodies above 16 MiB", async () => {
    mockResponse({ contentLength: `${16 * 1024 * 1024 + 1}` });
    expect((await GET(createRequest(SOURCE))).status).toBe(413);

    const streamedBody = mockResponse({
      contentLength: null,
      body: createReadableBody([new Uint8Array(16 * 1024 * 1024 + 1)]),
    });
    expect((await GET(createRequest(SOURCE))).status).toBe(413);
    expect(streamedBody?.cancel).toHaveBeenCalledTimes(1);
  });

  it("streams safely when content-length is malformed", async () => {
    mockResponse({ contentLength: "not-a-number" });
    expect((await GET(createRequest(SOURCE))).status).toBe(200);

    mockResponse({ contentLength: "-1" });
    expect((await GET(createRequest(SOURCE))).status).toBe(200);
  });

  it("maps timeout and fetch failures to stable gateway errors", async () => {
    mockFetchPublicUrl.mockRejectedValueOnce(
      new UrlGuardError("timeout", "timeout", 504)
    );
    expect((await GET(createRequest(SOURCE))).status).toBe(504);

    mockFetchPublicUrl.mockRejectedValueOnce(
      new UrlGuardError("failed", "fetch-failed", 502)
    );
    expect((await GET(createRequest(SOURCE))).status).toBe(502);
  });
});
