import type { NextRequest } from "next/server";

const mockFetchPublicUrl = jest.fn();

class MockHeaders {
  private readonly values = new Map<string, string>();

  constructor(init?: Record<string, string> | MockHeaders | undefined) {
    if (init instanceof MockHeaders) {
      init.values.forEach((value, key) => this.values.set(key, value));
      return;
    }

    Object.entries(init ?? {}).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  get(key: string): string | null {
    return this.values.get(key.toLowerCase()) ?? null;
  }

  set(key: string, value: string): void {
    this.values.set(key.toLowerCase(), value);
  }
}

class MockNextResponse {
  readonly body: unknown;
  readonly headers: MockHeaders;
  readonly status: number;

  constructor(
    body?: unknown,
    init?: { headers?: Record<string, string> | MockHeaders; status?: number }
  ) {
    this.body = body;
    this.headers = new MockHeaders(init?.headers);
    this.status = init?.status ?? 200;
  }

  static json(
    body: unknown,
    init?: { headers?: Record<string, string>; status?: number }
  ): MockNextResponse {
    const headers = new MockHeaders(init?.headers);
    headers.set("content-type", "application/json");
    return new MockNextResponse(JSON.stringify(body), {
      headers,
      status: init?.status,
    });
  }

  async json(): Promise<unknown> {
    return JSON.parse(await this.text());
  }

  async text(): Promise<string> {
    if (typeof this.body === "string") {
      return this.body;
    }
    if (this.body instanceof Uint8Array) {
      return new TextDecoder().decode(this.body);
    }
    if (this.body instanceof ArrayBuffer) {
      return new TextDecoder().decode(this.body);
    }
    return "";
  }
}

Object.defineProperty(globalThis, "Headers", {
  configurable: true,
  value: MockHeaders,
});

jest.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: MockNextResponse,
}));

jest.mock("@/lib/security/urlGuard", () => {
  class MockUrlGuardError extends Error {
    readonly kind: string;
    readonly statusCode: number;

    constructor(message: string, kind: string, statusCode = 400) {
      super(message);
      this.kind = kind;
      this.statusCode = statusCode;
    }
  }

  return {
    UrlGuardError: MockUrlGuardError,
    fetchPublicUrl: mockFetchPublicUrl,
    parsePublicUrl: jest.fn((value: string | null | undefined) => {
      if (!value) {
        throw new MockUrlGuardError("missing url", "missing-url", 400);
      }
      return new URL(value);
    }),
  };
});

import { PROFILE_CMS_ASSET_PROXY_ALLOWED_HOSTS } from "@/lib/profile-cms/runtime/mediaProxy";

type GetHandler = typeof import("@/app/api/profile-cms/assets/route").GET;
let GET: GetHandler;

const ALLOWED_IMAGE_URL =
  "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x1000/0x33FD426905f149f8376e227d0C9D3340AaD17aF1/1.WEBP";
const ALLOWED_JSON_URL =
  "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji/emoji-list.json?t=1";

describe("profile CMS asset route", () => {
  beforeAll(async () => {
    ({ GET } = await import("@/app/api/profile-cms/assets/route"));
  });

  beforeEach(() => {
    mockFetchPublicUrl.mockReset();
  });

  it("rejects missing and unsupported urls", async () => {
    await expectJsonError(
      "https://6529.io/api/profile-cms/assets",
      400,
      "Invalid CMS asset URL"
    );
    await expectJsonError(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(
        "https://example.com/image.webp"
      )}`,
      400,
      "Unsupported CMS asset URL"
    );
    await expectJsonError(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(
        "https://d3lqz0a4bldqgf.cloudfront.net/private/image.webp"
      )}`,
      400,
      "Unsupported CMS asset URL"
    );
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
  });

  it("proxies allowed image assets through urlGuard", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createUpstreamResponse("image-bytes", {
        headers: {
          "content-length": "11",
          "content-type": "image/webp",
        },
        status: 200,
      })
    );

    const response = await GET(createRequest(ALLOWED_IMAGE_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=86400, s-maxage=86400"
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("image-bytes");
    expect(mockFetchPublicUrl).toHaveBeenCalledWith(
      new URL(ALLOWED_IMAGE_URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: expect.stringContaining("image/webp"),
        }),
      }),
      expect.objectContaining({
        policy: { allowedHosts: PROFILE_CMS_ASSET_PROXY_ALLOWED_HOSTS },
        userAgent: expect.stringContaining("Mozilla/5.0"),
      })
    );
  });

  it("proxies allowed emoji JSON with a shorter cache TTL", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createUpstreamResponse(JSON.stringify(["6529white"]), {
        headers: {
          "content-length": "13",
          "content-type": "application/json",
        },
        status: 200,
      })
    );

    const response = await GET(createRequest(ALLOWED_JSON_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, s-maxage=300"
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toEqual(["6529white"]);
  });

  it("rejects oversized or unsupported upstream responses", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createUpstreamResponse("too-large", {
        headers: {
          "content-length": `${16 * 1024 * 1024 + 1}`,
          "content-type": "image/webp",
        },
        status: 200,
      })
    );
    await expectJsonError(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(
        ALLOWED_IMAGE_URL
      )}`,
      413,
      "CMS asset response is too large"
    );

    mockFetchPublicUrl.mockResolvedValueOnce(
      createUpstreamResponse("<html></html>", {
        headers: {
          "content-length": "13",
          "content-type": "text/html",
        },
        status: 200,
      })
    );
    await expectJsonError(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(
        ALLOWED_IMAGE_URL
      )}`,
      415,
      "Unsupported CMS asset content type"
    );
  });

  it("rejects an oversized upstream body without a content-length header", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createUpstreamResponse("x".repeat(16 * 1024 * 1024 + 1), {
        headers: {
          "content-type": "image/webp",
        },
        status: 200,
      })
    );

    await expectJsonError(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(
        ALLOWED_IMAGE_URL
      )}`,
      413,
      "CMS asset response is too large"
    );
  });

  it("rejects a redirected final URL outside the allowlist", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createUpstreamResponse("image-bytes", {
        headers: {
          "content-length": "11",
          "content-type": "image/webp",
        },
        status: 200,
        url: "https://example.com/image.webp",
      })
    );

    await expectJsonError(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(
        ALLOWED_IMAGE_URL
      )}`,
      400,
      "Unsupported CMS asset URL"
    );
  });
});

function createRequest(target: string): NextRequest {
  return {
    nextUrl: new URL(
      `https://6529.io/api/profile-cms/assets?url=${encodeURIComponent(target)}`
    ),
  } as NextRequest;
}

function createUpstreamResponse(
  body: string,
  options: {
    readonly headers: Record<string, string>;
    readonly status: number;
    readonly url?: string;
  }
): {
  readonly body: string;
  readonly headers: MockHeaders;
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
} {
  return {
    body,
    headers: new MockHeaders(options.headers),
    ok: options.status >= 200 && options.status < 300,
    status: options.status,
    url: options.url ?? "",
  };
}

async function expectJsonError(
  requestUrl: string,
  status: number,
  message: string
): Promise<void> {
  const response = await GET({
    nextUrl: new URL(requestUrl),
  } as NextRequest);

  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual({ error: message });
}
