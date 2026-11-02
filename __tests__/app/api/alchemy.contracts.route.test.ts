/** @jest-environment node */
const mockNextResponseJson = jest.fn((body: unknown, init?: ResponseInit) => ({
  body,
  headers: init?.headers,
  status: init?.status ?? 200,
}));

jest.mock("next/server", () => ({
  NextResponse: { json: mockNextResponseJson },
}));

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(() => "test-alchemy-key"),
}));

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/alchemy/contracts/route";

const CONTRACT_ONE = "0x0000000000000000000000000000000000000001";
const CONTRACT_TWO = "0x0000000000000000000000000000000000000002";
const CONTRACT_THREE = "0x0000000000000000000000000000000000000003";
const CONTRACT_FOUR = "0x0000000000000000000000000000000000000004";
const CONTRACT_FIVE = "0x0000000000000000000000000000000000000005";

type MockBodyReadResult =
  | { readonly done: false; readonly value: Uint8Array }
  | { readonly done: true; readonly value: undefined };

type MockRequest = {
  readonly body: {
    getReader(): {
      read: jest.Mock<Promise<MockBodyReadResult>, []>;
    };
  };
  readonly headers: Headers;
  readonly signal: AbortSignal;
};

type RouteResponse = {
  readonly body: unknown;
  readonly headers?: HeadersInit;
  readonly status: number;
};

function requestFor(body: unknown, clientIp?: string): NextRequest {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);
  const encodedBody = new TextEncoder().encode(rawBody);
  let bodyRead = false;

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
    headers: new Headers({
      "content-type": "application/json",
      ...(clientIp === undefined ? {} : { "x-forwarded-for": clientIp }),
    }),
    signal: new AbortController().signal,
  };
  return request as unknown as NextRequest;
}

function contractAddress(index: number): string {
  return `0x${(0x1000 + index).toString(16).padStart(40, "0")}`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("app/api/alchemy/contracts route", () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockNextResponseJson.mockClear();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches unique normalized contract metadata and includes null 404 entries", async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          contractMetadata: {
            name: "Collection One",
            tokenType: "ERC721",
          },
        })
      )
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));

    const response = (await POST(
      requestFor({
        contracts: [
          { address: CONTRACT_ONE, chain: "ethereum" },
          { address: CONTRACT_ONE, chain: "ethereum" },
          { address: CONTRACT_TWO, chain: "ethereum" },
        ],
      })
    )) as RouteResponse;

    expect(response.status).toBe(200);
    expect(response.headers).toEqual({ "Cache-Control": "no-store" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0]?.[0]).toContain(
      `getContractMetadata?contractAddress=${CONTRACT_ONE}`
    );
    expect(mockFetch.mock.calls[1]?.[0]).toContain(
      `getContractMetadata?contractAddress=${CONTRACT_TWO}`
    );
    expect(response.body).toEqual({
      contracts: [
        {
          address: CONTRACT_ONE,
          chain: "ethereum",
          metadata: {
            contractMetadata: {
              name: "Collection One",
              tokenType: "ERC721",
            },
            _checksum: CONTRACT_ONE,
          },
        },
        {
          address: CONTRACT_TWO,
          chain: "ethereum",
          metadata: null,
        },
      ],
    });
  });

  it("rejects invalid contract addresses before calling Alchemy", async () => {
    const response = (await POST(
      requestFor({ contracts: [{ address: "not-an-address" }] })
    )) as RouteResponse;

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid contract address" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps successful entries when one contract fetch throws", async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          contractMetadata: {
            name: "Collection Three",
            tokenType: "ERC721",
          },
        })
      )
      .mockRejectedValueOnce(new Error("network unavailable"));

    const response = (await POST(
      requestFor({
        contracts: [
          { address: CONTRACT_THREE, chain: "ethereum" },
          { address: CONTRACT_FOUR, chain: "ethereum" },
        ],
      })
    )) as RouteResponse;

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(response.body).toEqual({
      contracts: [
        {
          address: CONTRACT_THREE,
          chain: "ethereum",
          metadata: {
            contractMetadata: {
              name: "Collection Three",
              tokenType: "ERC721",
            },
            _checksum: CONTRACT_THREE,
          },
        },
        {
          address: CONTRACT_FOUR,
          chain: "ethereum",
          metadata: null,
          error: "Failed to fetch contract metadata",
          status: 502,
        },
      ],
    });
  });

  it("reports oversized upstream metadata as a failed entry", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(`{"name":"${"x".repeat(256 * 1024)}"}`)
    );

    const response = (await POST(
      requestFor({ contracts: [{ address: CONTRACT_FIVE }] })
    )) as RouteResponse;

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      contracts: [
        {
          address: CONTRACT_FIVE,
          chain: "ethereum",
          metadata: null,
          error: "Failed to fetch contract metadata",
          status: 502,
        },
      ],
    });
  });

  it("caps concurrent upstream lookups within one request", async () => {
    let active = 0;
    let maxActive = 0;
    mockFetch.mockImplementation(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return jsonResponse({ contractMetadata: { name: "Collection" } });
    });

    const response = (await POST(
      requestFor({
        contracts: Array.from({ length: 25 }, (_, index) => ({
          address: contractAddress(index),
        })),
      })
    )) as RouteResponse;

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(25);
    expect(maxActive).toBeLessThanOrEqual(10);
  });

  it("rate limits each client by the number of contracts requested", async () => {
    mockFetch.mockImplementation(async () =>
      jsonResponse({ contractMetadata: { name: "Collection" } })
    );
    const body = {
      contracts: Array.from({ length: 50 }, (_, index) => ({
        address: contractAddress(100 + index),
      })),
    };

    for (let index = 0; index < 12; index += 1) {
      const allowed = (await POST(
        requestFor(body, "8.8.4.4")
      )) as RouteResponse;
      expect(allowed.status).toBe(200);
    }
    const limited = (await POST(requestFor(body, "8.8.4.4"))) as RouteResponse;

    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: "Too many contract metadata requests",
    });
    expect(limited.headers).toEqual(
      expect.objectContaining({ "Retry-After": expect.any(String) })
    );
    // Repeated lookups are served from the shared contract metadata cache.
    expect(mockFetch).toHaveBeenCalledTimes(50);
  });
});
