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
  isForbiddenAddress,
  parseIpv6Groups,
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
    { label: "NAT64 to loopback", address: "64:ff9b::7f00:1", family: 6 },
    { label: "6to4", address: "2002:808:808::1", family: 6 },
    { label: "IPv6 multicast", address: "ff02::1", family: 6 },
    { label: "IPv6 site-local", address: "fec0::1", family: 6 },
    { label: "IPv6 documentation", address: "2001:db8::1", family: 6 },
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

describe("isForbiddenAddress", () => {
  it.each([
    "::",
    "::1",
    "0:0:0:0:0:0:0:1",
    "fe80::1",
    "fe80::1%eth0",
    "febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
    "fc00::1",
    "fdff:ffff::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "0:0:0:0:0:ffff:10.0.0.1",
    "::ffff:a9fe:a9fe",
  ])("rejects the pre-existing special range address %s", (address) => {
    expect(isForbiddenAddress(address)).toBe(true);
  });

  it.each([
    ["NAT64 loopback", "64:ff9b::7f00:1"],
    ["NAT64 loopback in dotted form", "64:ff9b::127.0.0.1"],
    ["NAT64 private-use", "64:ff9b::a00:1"],
    ["NAT64 link-local metadata", "64:ff9b::169.254.169.254"],
    ["NAT64 unspecified", "64:ff9b::"],
    ["NAT64 in expanded form", "0064:ff9b:0000:0000:0000:0000:c0a8:0101"],
  ])("rejects %s through the embedded IPv4 rules", (_label, address) => {
    expect(isForbiddenAddress(address)).toBe(true);
  });

  it.each([
    ["NAT64 public IPv4", "64:ff9b::808:808"],
    ["NAT64 public IPv4 in dotted form", "64:ff9b::8.8.8.8"],
    ["IPv4-mapped public IPv4", "::ffff:8.8.8.8"],
  ])("allows %s", (_label, address) => {
    expect(isForbiddenAddress(address)).toBe(false);
  });

  it.each([
    ["6to4 low edge", "2002::"],
    ["6to4 with a public IPv4", "2002:808:808::1"],
    ["6to4 with loopback", "2002:7f00:1::1"],
    ["6to4 high edge", "2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff"],
    ["multicast all-nodes", "ff02::1"],
    ["multicast low edge", "ff00::"],
    ["multicast high edge", "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"],
    ["multicast global scope", "ff0e::1"],
    ["site-local low edge", "fec0::"],
    ["site-local", "fec0::1"],
    ["site-local high edge", "feff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"],
    ["documentation low edge", "2001:db8::"],
    ["documentation", "2001:db8:1234::1"],
    ["documentation high edge", "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff"],
  ])("rejects %s", (_label, address) => {
    expect(isForbiddenAddress(address)).toBe(true);
  });

  it.each([
    ["global unicast", "2606:2800:220:1:248:1893:25c8:1946"],
    ["a public resolver", "2001:4860:4860::8888"],
    ["an address just below the documentation range", "2001:db7:ffff::1"],
    ["an address just above the documentation range", "2001:db9::1"],
    ["an address just below the 6to4 range", "2001:ffff::1"],
    ["an address just above the 6to4 range", "2003::1"],
    ["an address just below the unique-local range", "fbff::1"],
  ])("does not reject %s", (_label, address) => {
    expect(isForbiddenAddress(address)).toBe(false);
  });

  it("rejects values that are not IP addresses", () => {
    expect(isForbiddenAddress("example.com")).toBe(true);
    expect(isForbiddenAddress("")).toBe(true);
  });

  it("keeps public IPv4 addresses allowed", () => {
    expect(isForbiddenAddress(SAFE_EXAMPLE_ADDRESS)).toBe(false);
    expect(isForbiddenAddress("10.0.0.1")).toBe(true);
  });
});

describe("parseIpv6Groups", () => {
  const MAPPED_1_2_3_4 = [0, 0, 0, 0, 0, 0xffff, 0x0102, 0x0304];

  it.each([
    ["::ffff:1.2.3.4", MAPPED_1_2_3_4],
    ["0:0:0:0:0:ffff:1.2.3.4", MAPPED_1_2_3_4],
    ["0000:0000:0000:0000:0000:ffff:1.2.3.4", MAPPED_1_2_3_4],
    ["::ffff:0102:0304", MAPPED_1_2_3_4],
    ["0:0:0:0:0:ffff:0102:0304", MAPPED_1_2_3_4],
    ["0000:0000:0000:0000:0000:ffff:0102:0304", MAPPED_1_2_3_4],
    ["::FFFF:1.2.3.4", MAPPED_1_2_3_4],
    ["0:0:0:0:0:FfFf:0102:0304", MAPPED_1_2_3_4],
    ["0:0::ffff:1.2.3.4", MAPPED_1_2_3_4],
    ["64:ff9b::8.8.8.8", [0x64, 0xff9b, 0, 0, 0, 0, 0x0808, 0x0808]],
    ["0064:FF9B:0:0:0:0:0808:0808", [0x64, 0xff9b, 0, 0, 0, 0, 0x0808, 0x0808]],
    ["::1.2.3.4", [0, 0, 0, 0, 0, 0, 0x0102, 0x0304]],
    ["1:2:3:4:5:6:1.2.3.4", [1, 2, 3, 4, 5, 6, 0x0102, 0x0304]],
    ["1:2:3:4:5:6:7:8", [1, 2, 3, 4, 5, 6, 7, 8]],
    ["::", [0, 0, 0, 0, 0, 0, 0, 0]],
    ["::1", [0, 0, 0, 0, 0, 0, 0, 1]],
    ["1::", [1, 0, 0, 0, 0, 0, 0, 0]],
    ["2606:2800:220:1:248:1893:25c8:1946", [0x2606, 0x2800, 0x220, 1, 0x248, 0x1893, 0x25c8, 0x1946]],
  ])("expands %s", (address, groups) => {
    expect(parseIpv6Groups(address)).toEqual(groups);
  });

  it.each([
    ["a dotted quad before the compression", "1.2.3.4::1"],
    ["a dotted quad as the whole head", "1.2.3.4::"],
    ["a dotted quad followed by another group", "::1.2.3.4:5"],
    ["a dotted quad in the middle", "1:1.2.3.4:5::"],
    ["a dotted quad in the middle without compression", "1:2:3:4:1.2.3.4:6:7"],
    ["a bare dotted quad", "1.2.3.4"],
    ["a dotted quad that overfills the address", "1:2:3:4:5:6:7:1.2.3.4"],
    ["a dotted quad that is not an IPv4 address", "::ffff:1.2.3"],
    ["a dotted quad with an out-of-range octet", "::ffff:1.2.3.256"],
    ["a dotted quad with a leading zero", "::ffff:01.2.3.4"],
    ["two dotted quads", "::1.2.3.4:5.6.7.8"],
    ["a scoped address", "fe80::1%eth0"],
    ["two compressions", "1::2::3"],
    ["a leading single colon", ":1:2:3:4:5:6:7"],
    ["too many groups", "1:2:3:4:5:6:7:8:9"],
    ["too few groups", "1:2:3:4:5:6:7"],
    ["a compression that hides no group", "1:2:3:4:5:6:7::8"],
    ["an oversized group", "12345::1"],
    ["a non-hex group", "g::1"],
    ["an empty string", ""],
  ])("rejects %s", (_label, address) => {
    expect(parseIpv6Groups(address)).toBeNull();
  });
});
