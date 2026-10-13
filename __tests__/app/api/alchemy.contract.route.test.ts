/** @jest-environment node */
import { NextRequest } from "next/server";

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(() => "test-alchemy-key"),
}));

import { GET } from "@/app/api/alchemy/contract/route";

const CONTRACT = "0x0000000000000000000000000000000000002001";

function requestFor(query: string, clientIp = "8.8.8.8"): NextRequest {
  return new NextRequest(`https://6529.io/api/alchemy/contract?${query}`, {
    headers: { "x-forwarded-for": clientIp },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("app/api/alchemy/contract route", () => {
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
    ["", "address is required"],
    ["address=not-an-address", "address is required"],
    [`address=${CONTRACT}&chain=polygon`, "Unsupported chain"],
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

  it("returns cached contract metadata with the checksum", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ name: "Collection", tokenType: "ERC721" })
    );

    const first = await GET(
      requestFor(`address=${CONTRACT.toLowerCase()}&chain=ethereum`)
    );
    const second = await GET(requestFor(`address=${CONTRACT}`, "1.1.1.1"));

    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("private, max-age=300");
    expect(await first.json()).toEqual({
      name: "Collection",
      tokenType: "ERC721",
      _checksum: CONTRACT,
    });
    expect(await second.json()).toEqual({
      name: "Collection",
      tokenType: "ERC721",
      _checksum: CONTRACT,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      `https://eth-mainnet.g.alchemy.com/nft/v3/test-alchemy-key/getContractMetadata?contractAddress=${CONTRACT}`
    );
  });

  it("returns null for unknown contracts and passes through upstream failures", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ error: "unavailable" }, 503));

    const missing = await GET(
      requestFor("address=0x0000000000000000000000000000000000002002")
    );
    const failed = await GET(
      requestFor("address=0x0000000000000000000000000000000000002003")
    );

    expect(missing.status).toBe(200);
    expect(await missing.json()).toBeNull();
    expect(failed.status).toBe(503);
    expect(failed.headers.get("cache-control")).toBe("no-store");
    expect(await failed.json()).toEqual({
      error: "Failed to fetch contract metadata",
    });
  });

  it("maps upstream timeouts to the upstream error shape", async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementationOnce(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason)
          );
        })
    );

    try {
      const pending = GET(
        requestFor("address=0x0000000000000000000000000000000000002005")
      );
      await jest.advanceTimersByTimeAsync(8000);
      const response = await pending;

      expect(response.status).toBe(504);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        error: "Failed to fetch contract metadata",
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("rate limits each client after its per-minute budget", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ name: "Limited" }));
    const query = "address=0x0000000000000000000000000000000000002004";

    for (let index = 0; index < 120; index += 1) {
      const allowed = await GET(requestFor(query, "8.8.4.4"));
      expect(allowed.status).toBe(200);
    }
    const limited = await GET(requestFor(query, "8.8.4.4"));
    const otherClient = await GET(requestFor(query, "9.9.9.9"));

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(await limited.json()).toEqual({
      error: "Too many contract metadata requests",
    });
    expect(otherClient.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
