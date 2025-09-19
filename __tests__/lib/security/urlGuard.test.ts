jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import { fetchPublicUrl, parsePublicUrl, UrlGuardError } from "@/lib/security/urlGuard";

const { lookup } = require("node:dns/promises") as {
  lookup: jest.Mock;
};

const originalFetch = global.fetch;

type MockResponseOptions = {
  readonly headers?: Record<string, string>;
  readonly body?: string;
  readonly url?: string;
};

const createResponse = (
  status: number,
  options: MockResponseOptions = {}
) => {
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

describe("urlGuard", () => {
  beforeEach(() => {
    lookup.mockReset();
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("validates redirect hops before fetching content", async () => {
    lookup.mockImplementation(async (hostname: string) => {
      if (hostname === "safe.example" || hostname === "cdn.safe.example") {
        return [{ address: "93.184.216.34", family: 4 }];
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

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(redirect)
      .mockResolvedValueOnce(success) as jest.MockedFunction<typeof fetch>;

    global.fetch = fetchMock;

    const response = await fetchPublicUrl(
      "https://safe.example/article",
      {},
      { userAgent: "test-agent", timeoutMs: 5000 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://safe.example/article",
      expect.objectContaining({ redirect: "manual" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://cdn.safe.example/page",
      expect.objectContaining({ redirect: "manual" })
    );
    expect(await response.text()).toBe("<html>ok</html>");
    expect(response.url).toBe("https://cdn.safe.example/page");
  });

  it("throws when URL cannot be parsed", () => {
    expect(() => parsePublicUrl("not a url")).toThrow(
      "The provided url parameter is not a valid URL."
    );
  });

  it("rejects private IP targets before hitting the network", async () => {
    await expect(
      fetchPublicUrl("http://127.0.0.1/secret")
    ).rejects.toThrow("URL host is not allowed.");
    expect(lookup).not.toHaveBeenCalled();
  });
});
