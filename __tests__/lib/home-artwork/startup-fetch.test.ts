/** @jest-environment node */
import {
  fetchWithHomeArtworkStartup,
  type HomeArtworkStartup,
} from "@/lib/home-artwork/startup-fetch";

describe("home artwork response adoption", () => {
  const nativeFetch = globalThis.fetch;
  const network = jest.fn();

  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    globalThis.fetch = network;
    network.mockReset();
    network.mockResolvedValue(new Response("network"));
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "__6529HomeArtworkStartup");
    globalThis.fetch = nativeFetch;
  });
  const setStartup = (take: HomeArtworkStartup["take"]) => {
    Reflect.set(globalThis, "__6529HomeArtworkStartup", { take });
  };

  it("uses the existing response without sending another request", async () => {
    const early = new Response("early");
    setStartup(() => Promise.resolve(early));
    expect(
      await fetchWithHomeArtworkStartup("https://api.test/api/memes_latest", {})
    ).toBe(early);
    expect(network).not.toHaveBeenCalled();
  });

  it("preserves failed HTTP responses for the normal API error/retry path", async () => {
    const failed = new Response("denied", { status: 401 });
    setStartup(() => Promise.resolve(failed));
    expect(
      (await fetchWithHomeArtworkStartup("https://api.test", {})).status
    ).toBe(401);
    expect(network).not.toHaveBeenCalled();
  });

  it.each([null, Promise.resolve(null)])(
    "uses normal networking when no early result is usable",
    async (pending) => {
      setStartup(() => pending);
      await fetchWithHomeArtworkStartup("https://api.test", {});
      expect(network).toHaveBeenCalledTimes(1);
    }
  );

  it("never intercepts writes", async () => {
    const take = jest.fn();
    setStartup(take);
    await fetchWithHomeArtworkStartup("https://api.test", { method: "POST" });
    expect(take).not.toHaveBeenCalled();
    expect(network).toHaveBeenCalledTimes(1);
  });

  it.each([{ credentials: "include" as const }, { body: "GET body" }])(
    "preserves native request semantics for unsupported options: %j",
    async (init) => {
      const take = jest.fn();
      setStartup(take);
      await fetchWithHomeArtworkStartup("https://api.test", init);
      expect(take).not.toHaveBeenCalled();
      expect(network).toHaveBeenCalledWith("https://api.test", init);
    }
  );

  it("leaves server fetching untouched even if a browser startup property exists", async () => {
    Reflect.deleteProperty(globalThis, "window");
    const take = jest.fn();
    setStartup(take);
    await fetchWithHomeArtworkStartup("https://api.test", {});
    expect(take).not.toHaveBeenCalled();
    expect(network).toHaveBeenCalledTimes(1);
  });

  it("does not consume early data for an already cancelled query", async () => {
    const take = jest.fn();
    setStartup(take);
    const controller = new AbortController();
    controller.abort();
    await expect(
      fetchWithHomeArtworkStartup("https://api.test", {
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(take).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });

  it("honors cancellation while waiting for an early response", async () => {
    setStartup(() => new Promise(() => undefined));
    const controller = new AbortController();
    const request = fetchWithHomeArtworkStartup("https://api.test", {
      signal: controller.signal,
    });
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(network).not.toHaveBeenCalled();
  });
});
