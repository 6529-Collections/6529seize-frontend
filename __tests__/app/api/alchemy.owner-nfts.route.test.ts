/** @jest-environment node */
import { NextRequest } from "next/server";

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(() => "test-alchemy-key"),
}));

import { GET } from "@/app/api/alchemy/owner-nfts/route";

const CONTRACT = "0x45882f9bc325E14FBb298a1Df930C43a874B83ae";
const OWNER = "0x0000000000000000000000000000000000003001";

function requestFor(query: string, clientIp = "8.8.8.8"): NextRequest {
  return new NextRequest(`https://6529.io/api/alchemy/owner-nfts?${query}`, {
    headers: { "x-forwarded-for": clientIp },
  });
}

function ownerQuery({
  chainId = "1",
  contract = CONTRACT,
  owner = OWNER,
  pageKey,
}: {
  readonly chainId?: string;
  readonly contract?: string;
  readonly owner?: string;
  readonly pageKey?: string;
} = {}): string {
  const params = new URLSearchParams({ chainId, contract, owner });
  if (pageKey !== undefined) {
    params.set("pageKey", pageKey);
  }
  return params.toString();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("app/api/alchemy/owner-nfts route", () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it.each([
    ["chainId=not-a-number", "chainId is required"],
    [`chainId=1&owner=${OWNER}`, "contract and owner are required"],
    [ownerQuery({ chainId: "5" }), "Unsupported chainId"],
    [ownerQuery({ chainId: "137" }), "Unsupported chainId"],
    [
      ownerQuery({ owner: "vitalik.eth" }),
      "contract and owner must be valid addresses",
    ],
    [
      ownerQuery({ contract: "0x123" }),
      "contract and owner must be valid addresses",
    ],
    [ownerQuery({ pageKey: "a&b" }), "Invalid pageKey"],
    [ownerQuery({ pageKey: "a".repeat(513) }), "Invalid pageKey"],
  ])(
    "rejects invalid input %p before calling Alchemy",
    async (query, error) => {
      const response = await GET(requestFor(query));

      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({ error });
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it("fetches normalized owner NFTs on the requested network and caches them", async () => {
    const payload = { ownedNfts: [{ tokenId: "1" }], totalCount: 1 };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));
    const pageKey = "MHgwMDA6MHgwMDE6ZmFsc2U=";

    const first = await GET(
      requestFor(
        ownerQuery({
          chainId: "11155111",
          contract: CONTRACT.toLowerCase(),
          pageKey,
        })
      )
    );
    const second = await GET(
      requestFor(ownerQuery({ chainId: "11155111", pageKey }), "1.1.1.1")
    );

    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("private, max-age=30");
    expect(await first.json()).toEqual(payload);
    expect(await second.json()).toEqual(payload);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const upstreamUrl = new URL(String(mockFetch.mock.calls[0]?.[0]));
    expect(upstreamUrl.origin).toBe("https://eth-sepolia.g.alchemy.com");
    expect(upstreamUrl.searchParams.get("owner")).toBe(OWNER);
    expect(upstreamUrl.searchParams.getAll("contractAddresses[]")).toEqual([
      CONTRACT,
    ]);
    expect(upstreamUrl.searchParams.get("pageKey")).toBe(pageKey);
  });

  it("passes upstream failures through without caching them", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: "unavailable" }, 503))
      .mockResolvedValueOnce(jsonResponse({ ownedNfts: [] }));
    const query = ownerQuery({
      owner: "0x0000000000000000000000000000000000003002",
    });

    const failed = await GET(requestFor(query));
    const retried = await GET(requestFor(query));

    expect(failed.status).toBe(503);
    expect(failed.headers.get("cache-control")).toBe("no-store");
    expect(await failed.json()).toEqual({
      error: "Failed to fetch NFTs for owner",
    });
    expect(retried.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("treats an empty pageKey as the first page", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ownedNfts: [] }));
    const owner = "0x0000000000000000000000000000000000003004";

    const empty = await GET(requestFor(ownerQuery({ owner, pageKey: "" })));
    const absent = await GET(requestFor(ownerQuery({ owner })));

    expect(empty.status).toBe(200);
    expect(absent.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const upstreamUrl = new URL(String(mockFetch.mock.calls[0]?.[0]));
    expect(upstreamUrl.searchParams.has("pageKey")).toBe(false);
  });

  it("rejects oversized upstream pages with the upstream error shape", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(`"${"x".repeat(2 * 1024 * 1024)}"`)
    );

    const response = await GET(
      requestFor(
        ownerQuery({ owner: "0x0000000000000000000000000000000000003005" })
      )
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Failed to fetch NFTs for owner",
    });
  });

  it("rate limits each client after its per-minute budget", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ownedNfts: [] }));
    const query = ownerQuery({
      owner: "0x0000000000000000000000000000000000003003",
    });

    for (let index = 0; index < 30; index += 1) {
      const allowed = await GET(requestFor(query, "8.8.4.4"));
      expect(allowed.status).toBe(200);
    }
    const limited = await GET(requestFor(query, "8.8.4.4"));
    const otherClient = await GET(requestFor(query, "9.9.9.9"));

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(await limited.json()).toEqual({
      error: "Too many owner NFT requests",
    });
    expect(otherClient.status).toBe(200);
  });
});
