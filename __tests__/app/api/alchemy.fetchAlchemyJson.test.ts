/** @jest-environment node */
import { fetchAlchemyJson } from "@/app/api/alchemy/fetchAlchemyJson";

const UPSTREAM_URL =
  "https://eth-mainnet.g.alchemy.com/nft/v3/key/getContractMetadata";

function hangUntilAborted(_input: unknown, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
  });
}

describe("fetchAlchemyJson", () => {
  const originalFetch = globalThis.fetch;
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns the parsed payload and its text", async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"name":"Collection"}'));

    await expect(
      fetchAlchemyJson(UPSTREAM_URL, {
        maxBytes: 1024,
        signal: new AbortController().signal,
      })
    ).resolves.toEqual({
      ok: true,
      payload: { name: "Collection" },
      text: '{"name":"Collection"}',
    });
  });

  it.each([
    [
      "an upstream error status",
      () => new Response("{}", { status: 404 }),
      404,
    ],
    ["an oversized body", () => new Response(`"${"x".repeat(2048)}"`), 502],
    ["invalid JSON", () => new Response("not json"), 502],
  ])("resolves %s to a status", async (_label, response, status) => {
    mockFetch.mockResolvedValueOnce(response());

    await expect(
      fetchAlchemyJson(UPSTREAM_URL, {
        maxBytes: 1024,
        signal: new AbortController().signal,
      })
    ).resolves.toEqual({ ok: false, status });
  });

  it("sends a JSON body as a POST and keeps plain requests as GET", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('{"tokens":[]}'))
      .mockResolvedValueOnce(new Response("{}"));
    const signal = new AbortController().signal;

    await fetchAlchemyJson(UPSTREAM_URL, {
      maxBytes: 1024,
      signal,
      jsonBody: { tokens: [{ contractAddress: "0x1", tokenId: "1" }] },
    });
    await fetchAlchemyJson(UPSTREAM_URL, { maxBytes: 1024, signal });

    const post = mockFetch.mock.calls[0]?.[1];
    expect(post?.method).toBe("POST");
    expect(post?.body).toBe(
      '{"tokens":[{"contractAddress":"0x1","tokenId":"1"}]}'
    );
    expect(post?.headers).toEqual(
      expect.objectContaining({ "Content-Type": "application/json" })
    );
    expect(mockFetch.mock.calls[1]?.[1]?.method).toBeUndefined();
  });

  it("resolves network failures to 502", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(
      fetchAlchemyJson(UPSTREAM_URL, {
        maxBytes: 1024,
        signal: new AbortController().signal,
      })
    ).resolves.toEqual({ ok: false, status: 502 });
  });

  it("times out slow upstream requests with 504", async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementationOnce(hangUntilAborted);

    const pending = fetchAlchemyJson(UPSTREAM_URL, {
      maxBytes: 1024,
      signal: new AbortController().signal,
    });
    await jest.advanceTimersByTimeAsync(8000);

    await expect(pending).resolves.toEqual({ ok: false, status: 504 });
    expect(mockFetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it("rejects when the caller aborts", async () => {
    const controller = new AbortController();
    mockFetch.mockImplementationOnce(hangUntilAborted);

    const pending = fetchAlchemyJson(UPSTREAM_URL, {
      maxBytes: 1024,
      signal: controller.signal,
    });
    controller.abort(new Error("client went away"));

    await expect(pending).rejects.toThrow("client went away");
  });
});
