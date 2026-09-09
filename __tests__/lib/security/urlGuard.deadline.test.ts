/** @jest-environment node */

jest.mock("node:dns/promises", () => ({ lookup: jest.fn() }));
const mockFetch = jest.fn();
jest.mock("undici", () => ({
  Agent: jest.fn(() => ({ dispatch: jest.fn() })),
  fetch: (...args: unknown[]) => mockFetch(...args),
}));

import { lookup } from "node:dns/promises";
import { fetchPublicUrl } from "@/lib/security/urlGuard";

const mockLookup = jest.mocked(lookup);
const options = { timeoutMs: 100, revalidateFinalUrl: false };

describe("public fetch deadline", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
    mockLookup.mockReset();
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  afterEach(() => jest.useRealTimers());

  it("ends a body that stalls after headers and cancels the upstream reader", async () => {
    const cancel = jest.fn();
    mockFetch.mockResolvedValue(new Response(new ReadableStream({ cancel })));
    const response = await fetchPublicUrl("https://example.com", {}, options);
    const forwarded = new Response(response.body);
    const result = expect(forwarded.text()).rejects.toMatchObject({
      kind: "timeout",
    });
    await jest.advanceTimersByTimeAsync(101);
    await result;
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("bounds DNS lookup before opening a connection", async () => {
    mockLookup.mockReturnValue(new Promise(() => {}));
    const result = expect(
      fetchPublicUrl("https://example.com", {}, options)
    ).rejects.toMatchObject({ kind: "timeout" });
    await jest.advanceTimersByTimeAsync(101);
    await result;
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps caller cancellation connected after headers", async () => {
    const caller = new AbortController();
    const reason = new Error("caller disconnected");
    mockFetch.mockResolvedValue(new Response(new ReadableStream()));
    const response = await fetchPublicUrl(
      "https://example.com",
      { signal: caller.signal },
      options
    );
    const result = expect(response.arrayBuffer()).rejects.toBe(reason);
    caller.abort(reason);
    await result;
    expect(jest.getTimerCount()).toBe(0);
  });

  it("streams promptly and preserves response identity metadata through clones", async () => {
    const upstream = new Response("preview", {
      status: 201,
      headers: { "x-preview": "yes" },
    });
    Object.defineProperty(upstream, "url", {
      value: "https://example.com/final",
    });
    mockFetch.mockResolvedValue(upstream);
    const response = await fetchPublicUrl("https://example.com", {}, options);
    const clone = response.clone();
    expect(clone.url).toBe(upstream.url);
    expect(response.status).toBe(201);
    expect(response.headers.get("x-preview")).toBe("yes");
    await expect(response.text()).resolves.toBe("preview");
    await expect(clone.text()).resolves.toBe("preview");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("releases the deadline and upstream when the consumer cancels", async () => {
    const cancel = jest.fn();
    mockFetch.mockResolvedValue(new Response(new ReadableStream({ cancel })));
    const response = await fetchPublicUrl("https://example.com", {}, options);
    await response.body?.cancel();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("uses one time budget across redirects and cancels discarded bodies", async () => {
    const cancel = jest.fn();
    mockFetch
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
        return new Response(new ReadableStream({ cancel }), {
          status: 302,
          headers: { location: "https://cdn.example.com/image" },
        });
      })
      .mockImplementationOnce(() => new Promise(() => {}));
    const result = expect(
      fetchPublicUrl("https://example.com", {}, options)
    ).rejects.toMatchObject({ kind: "timeout" });
    await jest.advanceTimersByTimeAsync(101);
    await result;
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
