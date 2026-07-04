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

function requestFor(body: unknown): NextRequest {
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
    headers: new Headers({ "content-type": "application/json" }),
    signal: new AbortController().signal,
  };
  return request as unknown as NextRequest;
}

function jsonResponse<T>(body: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
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
});
