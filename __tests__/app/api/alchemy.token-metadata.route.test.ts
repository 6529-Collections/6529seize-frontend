const mockNextResponseJson = jest.fn((body: unknown, init?: ResponseInit) => ({
  body,
  headers: init?.headers,
  status: init?.status ?? 200,
}));

jest.mock("next/server", () => ({
  NextResponse: { json: mockNextResponseJson },
}));

const mockFetchAlchemyJson = jest.fn();

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(() => "test-alchemy-key"),
}));

jest.mock("@/app/api/alchemy/fetchAlchemyJson", () => ({
  fetchAlchemyJson: (...args: unknown[]) => mockFetchAlchemyJson(...args),
}));

function upstreamTokens(tokens: readonly unknown[]) {
  const payload = { tokens };
  return { ok: true, payload, text: JSON.stringify(payload) };
}

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
    mockNextResponseJson.mockClear();
    mockFetchAlchemyJson.mockReset();
    mockFetchAlchemyJson.mockImplementation(async () => upstreamTokens([]));
  });

  it("fetches normalized metadata batches and caches identical requests", async () => {
    mockFetchAlchemyJson.mockResolvedValueOnce(
      upstreamTokens([{ tokenId: "1", title: "Cached token" }])
    );

    const body = {
      address: CONTRACT,
      chain: "ethereum",
      tokenIds: ["1"],
    };

    const first = (await POST(requestFor(body, "8.8.8.10"))) as RouteResponse;
    const second = (await POST(requestFor(body, "8.8.8.11"))) as RouteResponse;

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body).toEqual({
      tokens: [{ tokenId: "1", title: "Cached token" }],
    });
    expect(second.body).toEqual(first.body);
    expect(mockFetchAlchemyJson).toHaveBeenCalledTimes(1);
    expect(mockFetchAlchemyJson.mock.calls[0]?.[0]).toContain(
      "test-alchemy-key"
    );
    expect(mockFetchAlchemyJson.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        jsonBody: { tokens: [{ contractAddress: CONTRACT, tokenId: "1" }] },
      })
    );
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
        "8.8.8.20"
      )
    )) as RouteResponse;

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: "Maximum 100 tokens per request",
    });
    expect(mockFetchAlchemyJson).not.toHaveBeenCalled();
  });

  it("rejects invalid contract addresses and token IDs", async () => {
    const invalidContract = (await POST(
      requestFor(
        { tokens: [{ contract: "not-an-address", tokenId: "1" }] },
        "8.8.8.30"
      )
    )) as RouteResponse;
    const invalidTokenId = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["-1"] }, "8.8.8.31")
    )) as RouteResponse;

    expect(invalidContract.status).toBe(400);
    expect(invalidContract.body).toEqual({ error: "Invalid contract address" });
    expect(invalidTokenId.status).toBe(400);
    expect(invalidTokenId.body).toEqual({ error: "Invalid tokenId" });
    expect(mockFetchAlchemyJson).not.toHaveBeenCalled();
  });

  it("rate limits each client after its per-minute budget", async () => {
    let response: RouteResponse | undefined;

    for (let index = 0; index < 121; index += 1) {
      response = (await POST(
        requestFor(
          { address: CONTRACT, tokenIds: [String(1000 + index)] },
          "8.8.8.40"
        )
      )) as RouteResponse;
    }

    expect(response?.status).toBe(429);
    expect(response?.body).toEqual({
      error: "Too many token metadata requests",
    });
    expect(response?.headers).toEqual(
      expect.objectContaining({ "Retry-After": expect.any(String) })
    );
    expect(mockFetchAlchemyJson).toHaveBeenCalledTimes(120);

    const otherClient = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["1"] }, "8.8.8.41")
    )) as RouteResponse;
    expect(otherClient.status).toBe(200);
  });

  it("does not let arbitrary bearer headers bypass the client rate limit", async () => {
    let response: RouteResponse | undefined;

    for (let index = 0; index < 121; index += 1) {
      response = (await POST(
        requestFor(
          { address: CONTRACT, tokenIds: [String(2000 + index)] },
          "8.8.8.42",
          { authorization: `Bearer caller-supplied-${index}` }
        )
      )) as RouteResponse;
    }

    expect(response?.status).toBe(429);
    expect(mockFetchAlchemyJson).toHaveBeenCalledTimes(120);
  });

  it("does not let client-supplied forwarded entries mint rate limit buckets", async () => {
    let response: RouteResponse | undefined;

    for (let index = 0; index < 121; index += 1) {
      response = (await POST(
        requestFor(
          { address: CONTRACT, tokenIds: [String(3000 + index)] },
          `1.0.${index}.1, 8.8.8.43, 172.31.0.10`
        )
      )) as RouteResponse;
    }

    expect(response?.status).toBe(429);
    expect(mockFetchAlchemyJson).toHaveBeenCalledTimes(120);
  });

  it("does not spend the budget on invalid requests", async () => {
    for (let index = 0; index < 121; index += 1) {
      await POST(requestFor({ tokens: [{ contract: "nope" }] }, "8.8.8.44"));
    }

    const response = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["4000"] }, "8.8.8.44")
    )) as RouteResponse;
    expect(response.status).toBe(200);
  });

  it("rejects oversized request bodies while streaming", async () => {
    const response = (await POST(
      requestFor(
        `{"address":"${CONTRACT}","tokenIds":["${"1".repeat(33_000)}"]}`,
        "8.8.8.50"
      )
    )) as RouteResponse;

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: "Request body is too large" });
    expect(mockFetchAlchemyJson).not.toHaveBeenCalled();
  });

  it("serves reordered and repeated token lists from one cached batch", async () => {
    mockFetchAlchemyJson.mockResolvedValueOnce(
      upstreamTokens([{ tokenId: "5001" }, { tokenId: "5002" }])
    );

    const first = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["5002", "5001"] }, "8.8.8.60")
    )) as RouteResponse;
    const reordered = (await POST(
      requestFor(
        { address: CONTRACT, tokenIds: ["5001", "5002", "5001"] },
        "8.8.8.61"
      )
    )) as RouteResponse;

    expect(first.status).toBe(200);
    expect(reordered.body).toEqual(first.body);
    expect(mockFetchAlchemyJson).toHaveBeenCalledTimes(1);
    expect(mockFetchAlchemyJson.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        jsonBody: {
          tokens: [
            { contractAddress: CONTRACT, tokenId: "5001" },
            { contractAddress: CONTRACT, tokenId: "5002" },
          ],
        },
        maxBytes: 4 * 1024 * 1024,
      })
    );
  });

  it("reports an upstream failure, such as an oversized response, without caching it", async () => {
    mockFetchAlchemyJson.mockResolvedValueOnce({ ok: false, status: 502 });

    const failed = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["6001"] }, "8.8.8.62")
    )) as RouteResponse;
    const retried = (await POST(
      requestFor({ address: CONTRACT, tokenIds: ["6001"] }, "8.8.8.62")
    )) as RouteResponse;

    expect(failed.status).toBe(502);
    expect(failed.body).toEqual({ error: "Failed to fetch token metadata" });
    expect(retried.status).toBe(200);
    expect(mockFetchAlchemyJson).toHaveBeenCalledTimes(2);
  });
});
