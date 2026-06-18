const mockNextResponseJson = jest.fn((body: unknown, init?: ResponseInit) => ({
  body,
  headers: init?.headers,
  status: init?.status ?? 200,
}));

jest.mock("next/server", () => ({
  NextResponse: { json: mockNextResponseJson },
}));

const mockFetchPublicJson = jest.fn();
const mockIsTrustedVercelRuntime = jest.fn(() => true);

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(() => "test-alchemy-key"),
}));

jest.mock("@/config/deploymentEnv", () => ({
  isTrustedVercelRuntime: () => mockIsTrustedVercelRuntime(),
}));

jest.mock("@/lib/security/urlGuard", () => {
  class UrlGuardError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  return {
    UrlGuardError,
    fetchPublicJson: (...args: unknown[]) => mockFetchPublicJson(...args),
  };
});

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/alchemy/token-metadata/route";

const CONTRACT = "0x0000000000000000000000000000000000000001";

type MockBodyReadResult =
  | { readonly done: false; readonly value: Uint8Array }
  | { readonly done: true; readonly value: undefined };

type MockRequest = {
  readonly body: {
    getReader(): {
      read: jest.Mock<Promise<MockBodyReadResult>, []>;
    };
  };
  readonly cookies: { readonly get: jest.Mock };
  readonly headers: Headers;
  readonly signal: AbortSignal;
};

type RouteResponse = {
  readonly body: unknown;
  readonly headers?: HeadersInit;
  readonly status: number;
};

function requestFor(
  body: unknown,
  clientIp: string,
  headers?: Record<string, string>
): NextRequest {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);
  const encodedBody = new TextEncoder().encode(rawBody);
  let bodyRead = false;
  const requestHeaders = new Headers({
    "content-type": "application/json",
    "user-agent": "jest",
    "x-forwarded-for": clientIp,
    "x-vercel-id": "iad1::jest",
  });
  Object.entries(headers ?? {}).forEach(([name, value]) => {
    requestHeaders.set(name, value);
  });

  const request: MockRequest = {
    body: {
      getReader() {
        return {
          read: jest.fn<Promise<MockBodyReadResult>, []>(async () => {
            if (bodyRead) {
              return { done: true, value: undefined };
            }
            bodyRead = true;
            return { done: false, value: encodedBody };
          }),
        };
      },
    },
    cookies: { get: jest.fn() },
    headers: requestHeaders,
    signal: new AbortController().signal,
  };
  return request as unknown as NextRequest;
}

describe("app/api/alchemy/token-metadata route", () => {
  beforeEach(() => {
    mockIsTrustedVercelRuntime.mockReturnValue(true);
    mockNextResponseJson.mockClear();
    mockFetchPublicJson.mockReset();
    mockFetchPublicJson.mockResolvedValue({ tokens: [] });
  });

  it("fetches normalized metadata batches and caches identical requests", async () => {
    mockFetchPublicJson.mockResolvedValueOnce({
      tokens: [{ tokenId: "1", title: "Cached token" }],
    });

    const body = {
      address: CONTRACT,
      chain: "ethereum",
      tokenIds: ["1"],
    };

    const first = (await POST(
      requestFor(body, "203.0.113.10")
    )) as RouteResponse;
    const second = (await POST(
      requestFor(body, "203.0.113.11")
    )) as RouteResponse;

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body).toEqual({
      tokens: [{ tokenId: "1", title: "Cached token" }],
    });
    expect(second.body).toEqual(first.body);
    expect(mockFetchPublicJson).toHaveBeenCalledTimes(1);
    expect(mockFetchPublicJson.mock.calls[0]?.[0]).toContain(
      "test-alchemy-key"
    );
    expect(
      JSON.parse(
        (mockFetchPublicJson.mock.calls[0]?.[1] as RequestInit).body as string
      )
    ).toEqual({
      tokens: [{ contractAddress: CONTRACT, tokenId: "1" }],
    });
  });

  it("rejects requests over the total token cap before calling Alchemy", async () => {
    const response = (await POST(
      requestFor(
        {
          address: CONTRACT,
          tokenIds: Array.from({ length: 101 }, (_, index) =>
            String(index + 1)
          ),
        },
        "203.0.113.20"
      )
    )) as RouteResponse;

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: "Maximum 100 tokens per request",
    });
    expect(mockFetchPublicJson).not.toHaveBeenCalled();
  });

  it("rejects invalid contract addresses and token IDs", async () => {
    const invalidContract = (await POST(
      requestFor(
        { tokens: [{ contract: "not-an-address", tokenId: "1" }] },
        "203.0.113.30"
      )
    )) as RouteResponse;
    const invalidTokenId = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["-1"] }, "203.0.113.31")
    )) as RouteResponse;

    expect(invalidContract.status).toBe(400);
    expect(invalidContract.body).toEqual({ error: "Invalid contract address" });
    expect(invalidTokenId.status).toBe(400);
    expect(invalidTokenId.body).toEqual({ error: "Invalid tokenId" });
    expect(mockFetchPublicJson).not.toHaveBeenCalled();
  });

  it("rate limits anonymous clients", async () => {
    let response: RouteResponse | undefined;

    for (let index = 0; index < 21; index += 1) {
      response = (await POST(
        requestFor(
          { address: CONTRACT, tokenIds: [String(1000 + index)] },
          "203.0.113.40"
        )
      )) as RouteResponse;
    }

    expect(response?.status).toBe(429);
    expect(response?.body).toEqual({
      error: "Too many token metadata requests",
    });
    expect(mockFetchPublicJson).toHaveBeenCalledTimes(20);
  });

  it("does not let arbitrary bearer headers bypass the client rate limit", async () => {
    let response: RouteResponse | undefined;

    for (let index = 0; index < 21; index += 1) {
      response = (await POST(
        requestFor(
          { address: CONTRACT, tokenIds: [String(2000 + index)] },
          "203.0.113.41",
          { authorization: `Bearer caller-supplied-${index}` }
        )
      )) as RouteResponse;
    }

    expect(response?.status).toBe(429);
    expect(response?.body).toEqual({
      error: "Too many token metadata requests",
    });
    expect(mockFetchPublicJson).toHaveBeenCalledTimes(20);
  });

  it("does not let untrusted forwarded headers mint rate limit buckets", async () => {
    mockIsTrustedVercelRuntime.mockReturnValue(false);
    let response: RouteResponse | undefined;

    for (let index = 0; index < 21; index += 1) {
      response = (await POST(
        requestFor(
          { address: CONTRACT, tokenIds: [String(3000 + index)] },
          `203.0.113.${index}`
        )
      )) as RouteResponse;
    }

    expect(response?.status).toBe(429);
    expect(response?.body).toEqual({
      error: "Too many token metadata requests",
    });
    expect(mockFetchPublicJson).toHaveBeenCalledTimes(20);
  });

  it("rejects oversized request bodies while streaming", async () => {
    const response = (await POST(
      requestFor(
        `{"address":"${CONTRACT}","tokenIds":["${"1".repeat(33_000)}"]}`,
        "203.0.113.50"
      )
    )) as RouteResponse;

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Request body is too large" });
    expect(mockFetchPublicJson).not.toHaveBeenCalled();
  });
});
