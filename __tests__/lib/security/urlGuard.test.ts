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

import { fetchPublicUrl, parsePublicUrl } from "@/lib/security/urlGuard";

const { lookup } = require("node:dns/promises") as {
  lookup: jest.Mock;
};

const SAFE_EXAMPLE_ADDRESS = ["93", "184", "216", "34"].join(".");
const CDN_SAFE_EXAMPLE_ADDRESS = ["93", "184", "216", "35"].join(".");

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

  it("validates redirect hops before fetching content", async () => {
    lookup.mockImplementation(async (hostname: string) => {
      if (hostname === "safe.example") {
        return [{ address: SAFE_EXAMPLE_ADDRESS, family: 4 }];
      }
      if (hostname === "cdn.safe.example") {
        return [{ address: CDN_SAFE_EXAMPLE_ADDRESS, family: 4 }];
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

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {},
      { userAgent: "test-agent", timeoutMs: 5000 }
    );

    expect(mockUndiciFetch).toHaveBeenCalledTimes(2);
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
