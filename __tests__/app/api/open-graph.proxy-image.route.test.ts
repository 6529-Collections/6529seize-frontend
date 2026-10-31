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
  readonly body: unknown;
  readonly headers: Headers;
  readonly status: number;

  constructor(body: unknown, init?: ResponseInit) {
    this.body = body;
    this.headers = new Headers(init?.headers);
    this.status = init?.status ?? 200;
  }

  static json(body: unknown, init?: ResponseInit): MockNextResponse {
    return new MockNextResponse(JSON.stringify(body), init);
  }

  async json(): Promise<unknown> {
    return JSON.parse(`${this.body}`);
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import { GET } from "@/app/api/open-graph/proxy-image/route";
import { fetchPublicUrl } from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";

const mockFetchPublicUrl = fetchPublicUrl as jest.Mock;
const IMAGE_URL = "https://wx1.sinaimg.cn/large/example.jpg";

const requestFor = (url: string): NextRequest =>
  ({
    nextUrl: new URL(
      `http://localhost/api/open-graph/proxy-image?url=${encodeURIComponent(url)}`
    ),
  }) as unknown as NextRequest;

const upstream = (
  contentType: string | null,
  overrides: { status?: number; ok?: boolean; hasBody?: boolean } = {}
) => {
  const body = { cancel: jest.fn().mockResolvedValue(undefined) };
  const headers = new Headers();
  if (contentType !== null) {
    headers.set("content-type", contentType);
  }
  const status = overrides.status ?? 200;
  return {
    body,
    response: {
      ok: overrides.ok ?? status < 400,
      status,
      url: IMAGE_URL,
      headers,
      body: overrides.hasBody === false ? null : body,
    },
  };
};

describe("open-graph proxy-image route", () => {
  beforeEach(() => {
    mockFetchPublicUrl.mockReset();
  });

  it.each([
    ["image/png", "image/png"],
    ["image/jpeg; charset=binary", "image/jpeg; charset=binary"],
    ["IMAGE/WEBP", "IMAGE/WEBP"],
    ["image/avif", "image/avif"],
    ["image/gif", "image/gif"],
  ])("proxies %p responses", async (contentType, expected) => {
    const { body, response } = upstream(contentType);
    mockFetchPublicUrl.mockResolvedValue(response);

    const result = await GET(requestFor(IMAGE_URL));

    expect(result.status).toBe(200);
    expect(result.body).toBe(body);
    expect(result.headers.get("content-type")).toBe(expected);
    expect(result.headers.get("cache-control")).toBe("public, max-age=86400");
  });

  it("streams a 206 body once the image type gate passes", async () => {
    const { body, response } = upstream("image/jpeg", { status: 206 });
    mockFetchPublicUrl.mockResolvedValue(response);

    const result = await GET(requestFor(IMAGE_URL));

    expect(result.status).toBe(206);
    expect(result.body).toBe(body);
    expect(body.cancel).not.toHaveBeenCalled();
    expect(result.headers.get("content-type")).toBe("image/jpeg");
    expect(result.headers.get("content-security-policy")).toBe("sandbox");
  });

  it("marks proxied images as sandboxed and not sniffable", async () => {
    mockFetchPublicUrl.mockResolvedValue(upstream("image/png").response);

    const result = await GET(requestFor(IMAGE_URL));

    expect(result.headers.get("content-security-policy")).toBe("sandbox");
    expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it.each([
    ["image/svg+xml"],
    ["image/svg+xml; charset=utf-8"],
    ["Image/SVG+XML"],
    ["image/svg"],
    ["text/html"],
    ["text/html; charset=utf-8"],
    ["application/xml"],
    ["application/octet-stream"],
    ["application/pdf"],
    ["text/plain; image/png"],
    ["image/"],
    ["image"],
    [""],
    [null],
  ])("rejects %p responses without proxying the body", async (contentType) => {
    const { body, response } = upstream(contentType);
    mockFetchPublicUrl.mockResolvedValue(response);

    const result = await GET(requestFor(IMAGE_URL));

    expect(result.status).toBe(415);
    expect(await result.json()).toEqual({ error: "Unsupported image type" });
    expect(result.body).not.toBe(body);
    expect(body.cancel).toHaveBeenCalledTimes(1);
  });

  it("keeps failing with a gateway error when the upstream request fails", async () => {
    const { body, response } = upstream("image/png", { status: 404 });
    mockFetchPublicUrl.mockResolvedValue(response);

    const result = await GET(requestFor(IMAGE_URL));

    expect(result.status).toBe(502);
    expect(body.cancel).toHaveBeenCalledTimes(1);
  });
});
