jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

type MockLookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | { address: string; family: number }[],
  family?: number
) => void;

type MockLookup = (
  hostname: string,
  options: { all?: boolean },
  callback: MockLookupCallback
) => void;

type MockAgentOptions = {
  readonly connect?: {
    readonly lookup?: MockLookup;
  };
};

const mockAgentOptionsByInstance = new WeakMap<object, MockAgentOptions>();
const mockUndiciFetch = jest.fn();

jest.mock("undici", () => ({
  Agent: jest.fn((options: MockAgentOptions) => {
    const instance = {
      close: jest.fn(),
      destroy: jest.fn(),
      dispatch: jest.fn(),
    };
    mockAgentOptionsByInstance.set(instance, options);
    return instance;
  }),
  fetch: (...args: unknown[]) => mockUndiciFetch(...args),
}));

import {
  fetchPublicUrl,
  parsePublicUrl,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";

const { lookup } = require("node:dns/promises") as {
  lookup: jest.Mock;
};

const SAFE_EXAMPLE_ADDRESS = ["93", "184", "216", "34"].join(".");
const CDN_SAFE_EXAMPLE_ADDRESS = ["93", "184", "216", "35"].join(".");
const SAFE_EXAMPLE_IPV6 = "2606:2800:220:1:248:1893:25c8:1946";

type MockResponseOptions = {
  readonly headers?: Record<string, string> | undefined;
  readonly body?: string | undefined;
  readonly url?: string | undefined;
};

const createResponse = (status: number, options: MockResponseOptions = {}) => {
  const headerEntries = Object.entries(options.headers ?? {}).reduce(
    (map, [key, value]) => map.set(key.toLowerCase(), value),
    new Map<string, string>()
  );

  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => headerEntries.get(name.toLowerCase()) ?? null,
    },
    text: async () => options.body ?? "",
    url: options.url ?? "https://example.com/final",
  };
};

const readPinnedLookupAddress = async (
  hostname: string,
  init: RequestInit | undefined
): Promise<{ address: string; family: number | undefined }> => {
  const dispatcher = (
    init as (RequestInit & { dispatcher?: unknown }) | undefined
  )?.dispatcher;
  if (typeof dispatcher !== "object" || dispatcher === null) {
    throw new Error("Pinned dispatcher was not configured.");
  }

  const lookup = mockAgentOptionsByInstance.get(dispatcher)?.connect?.lookup;
  if (!lookup) {
    throw new Error("Pinned lookup was not configured for dispatcher.");
  }

  return new Promise((resolve, reject) => {
    lookup(hostname, {}, (error, address, family) => {
      if (error) {
        reject(error);
        return;
      }
      if (typeof address !== "string") {
        reject(new Error("Expected a single pinned address."));
        return;
      }
      resolve({ address, family });
    });
  });
};

describe("urlGuard", () => {
  beforeEach(() => {
    lookup.mockReset();
    mockUndiciFetch.mockReset();
  });

  it("validates and pins every redirect hop before fetching content", async () => {
    let cdnLookupCount = 0;
    lookup.mockImplementation(async (hostname: string) => {
      if (hostname === "safe.example") {
        return [{ address: SAFE_EXAMPLE_ADDRESS, family: 4 }];
      }
      if (hostname === "cdn.safe.example") {
        cdnLookupCount += 1;
        return cdnLookupCount === 1
          ? [{ address: CDN_SAFE_EXAMPLE_ADDRESS, family: 4 }]
          : [{ address: "127.0.0.1", family: 4 }];
      }
      throw new Error(`Unexpected host: ${hostname}`);
    });

    const redirect = createResponse(302, {
      headers: { location: "https://cdn.safe.example/page" },
      url: "https://safe.example/article",
    });
    const success = createResponse(200, {
      headers: { "content-type": "text/html" },
      body: "<html>ok</html>",
      url: "https://cdn.safe.example/page",
    });

    mockUndiciFetch
      .mockImplementationOnce(async (_url, init) => {
        await expect(
          readPinnedLookupAddress("safe.example", init)
        ).resolves.toEqual({ address: SAFE_EXAMPLE_ADDRESS, family: 4 });
        return redirect;
      })
      .mockImplementationOnce(async (_url, init) => {
        await expect(
          readPinnedLookupAddress("cdn.safe.example", init)
        ).resolves.toEqual({ address: CDN_SAFE_EXAMPLE_ADDRESS, family: 4 });
        return success;
      });
    const buildRequestInit = jest.fn(
      (_url: URL, requestInit: RequestInit) => requestInit
    );

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {},
      {
        userAgent: "test-agent",
        timeoutMs: 5000,
        buildRequestInit,
        revalidateFinalUrl: false,
      }
    );

    expect(mockUndiciFetch).toHaveBeenCalledTimes(2);
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(cdnLookupCount).toBe(1);
    expect(buildRequestInit.mock.calls.map(([url]) => url.toString())).toEqual([
      "https://safe.example/article",
      "https://cdn.safe.example/page",
    ]);
    expect(mockUndiciFetch).toHaveBeenNthCalledWith(
      1,
      "https://safe.example/article",
      expect.objectContaining({ redirect: "manual" })
    );
    expect(mockUndiciFetch).toHaveBeenNthCalledWith(
      2,
      "https://cdn.safe.example/page",
      expect.objectContaining({ redirect: "manual" })
    );
    expect(await response.text()).toBe("<html>ok</html>");
    expect(response.url).toBe("https://cdn.safe.example/page");
  });

  it("pins the fetch lookup to the validated DNS answer", async () => {
    lookup.mockResolvedValue([{ address: SAFE_EXAMPLE_ADDRESS, family: 4 }]);

    const success = createResponse(200, {
      body: "ok",
      url: "https://safe.example/article",
    });
    mockUndiciFetch.mockImplementation(async (_url, init) => {
      await expect(
        readPinnedLookupAddress("safe.example", init)
      ).resolves.toEqual({ address: SAFE_EXAMPLE_ADDRESS, family: 4 });
      return success;
    });

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {},
      { revalidateFinalUrl: false }
    );

    expect(mockUndiciFetch).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(await response.text()).toBe("ok");
  });

  it("pins public IPv6 answers without changing the request hostname", async () => {
    lookup.mockResolvedValue([{ address: SAFE_EXAMPLE_IPV6, family: 6 }]);

    const success = createResponse(200, {
      body: "ipv6",
      url: "https://safe.example/article",
    });
    mockUndiciFetch.mockImplementation(async (url, init) => {
      expect(url).toBe("https://safe.example/article");
      await expect(
        readPinnedLookupAddress("safe.example", init)
      ).resolves.toEqual({ address: SAFE_EXAMPLE_IPV6, family: 6 });
      return success;
    });

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {},
      { revalidateFinalUrl: false }
    );

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(await response.text()).toBe("ipv6");
  });

  it("rejects mixed public and private DNS answers before opening a socket", async () => {
    lookup.mockResolvedValue([
      { address: SAFE_EXAMPLE_ADDRESS, family: 4 },
      { address: "10.0.0.8", family: 4 },
    ]);

    await expect(
      fetchPublicUrl("https://mixed.safe.example/article")
    ).rejects.toThrow("Resolved host is not reachable.");

    expect(mockUndiciFetch).not.toHaveBeenCalled();
  });

  it("rejects IPv4-mapped IPv6 loopback answers before opening a socket", async () => {
    lookup.mockResolvedValue([{ address: "::ffff:127.0.0.1", family: 6 }]);

    await expect(
      fetchPublicUrl("https://mapped.safe.example/article")
    ).rejects.toThrow("Resolved host is not reachable.");

    expect(mockUndiciFetch).not.toHaveBeenCalled();
  });

  it.each([
    { label: "IPv4 link-local", address: "169.254.169.254", family: 4 },
    { label: "IPv6 link-local", address: "fe80::1", family: 6 },
    { label: "IPv6 private-use", address: "fd00::1", family: 6 },
  ])(
    "rejects $label DNS answers before opening a socket",
    async ({ address, family }) => {
      lookup.mockResolvedValue([{ address, family }]);

      await expect(
        fetchPublicUrl("https://blocked.safe.example/article")
      ).rejects.toThrow("Resolved host is not reachable.");

      expect(mockUndiciFetch).not.toHaveBeenCalled();
    }
  );

  it("blocks a redirect hop that resolves to a private address", async () => {
    lookup.mockImplementation(async (hostname: string) => {
      if (hostname === "safe.example") {
        return [{ address: SAFE_EXAMPLE_ADDRESS, family: 4 }];
      }
      if (hostname === "private.safe.example") {
        return [{ address: "192.168.1.20", family: 4 }];
      }
      throw new Error(`Unexpected host: ${hostname}`);
    });
    mockUndiciFetch.mockResolvedValue(
      createResponse(302, {
        headers: { location: "https://private.safe.example/secret" },
        url: "https://safe.example/article",
      })
    );

    await expect(
      fetchPublicUrl("https://safe.example/article")
    ).rejects.toThrow("Resolved host is not reachable.");

    expect(mockUndiciFetch).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it("ignores legacy custom fetch implementations that could discard DNS pinning", async () => {
    lookup.mockResolvedValue([{ address: SAFE_EXAMPLE_ADDRESS, family: 4 }]);

    const success = createResponse(200, {
      body: "pinned",
      url: "https://safe.example/article",
    });
    mockUndiciFetch.mockImplementation(async (_url, init) => {
      await expect(
        readPinnedLookupAddress("safe.example", init)
      ).resolves.toEqual({ address: SAFE_EXAMPLE_ADDRESS, family: 4 });
      return success;
    });

    const unrestrictedFetch = jest.fn().mockResolvedValue(
      createResponse(200, {
        body: "unpinned",
        url: "http://127.0.0.1/private",
      })
    );
    const options = {
      revalidateFinalUrl: false,
      fetchImpl: unrestrictedFetch,
    } as FetchPublicUrlOptions & { fetchImpl: typeof fetch };

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {},
      options
    );

    expect(unrestrictedFetch).not.toHaveBeenCalled();
    expect(mockUndiciFetch).toHaveBeenCalledTimes(1);
    expect(await response.text()).toBe("pinned");
  });

  it("does not let request options replace guard-controlled transport or abort settings", async () => {
    lookup.mockResolvedValue([{ address: SAFE_EXAMPLE_ADDRESS, family: 4 }]);
    const unrestrictedDispatcher = { dispatch: jest.fn() };
    const unrestrictedAgent = { addRequest: jest.fn() };
    const unrestrictedController = new AbortController();
    const success = createResponse(200, {
      body: "pinned",
      url: "https://safe.example/article",
    });
    mockUndiciFetch.mockImplementation(async (_url, init) => {
      expect(
        (init as RequestInit & { dispatcher?: unknown }).dispatcher
      ).not.toBe(unrestrictedDispatcher);
      expect((init as RequestInit & { agent?: unknown }).agent).toBeUndefined();
      expect(init.redirect).toBe("manual");
      expect(init.signal).not.toBe(unrestrictedController.signal);
      await expect(
        readPinnedLookupAddress("safe.example", init)
      ).resolves.toEqual({ address: SAFE_EXAMPLE_ADDRESS, family: 4 });
      return success;
    });

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {
        dispatcher: unrestrictedDispatcher,
        agent: unrestrictedAgent,
        redirect: "follow",
        signal: unrestrictedController.signal,
      } as RequestInit,
      {
        revalidateFinalUrl: false,
        buildRequestInit: (_url, init) =>
          ({
            ...init,
            dispatcher: unrestrictedDispatcher,
            agent: unrestrictedAgent,
            redirect: "follow",
            signal: unrestrictedController.signal,
          }) as RequestInit,
      }
    );

    expect(await response.text()).toBe("pinned");
  });

  it("throws when URL cannot be parsed", () => {
    expect(() => parsePublicUrl("not a url")).toThrow(
      "The provided url parameter is not a valid URL."
    );
  });

  it("rejects private IP targets before hitting the network", async () => {
    await expect(fetchPublicUrl("http://127.0.0.1/secret")).rejects.toThrow(
      "URL host is not allowed."
    );
    expect(lookup).not.toHaveBeenCalled();
  });
});
