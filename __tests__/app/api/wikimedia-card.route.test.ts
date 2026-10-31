jest.mock("undici", () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  fetch: jest.fn(),
}));

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    assertPublicUrl: jest.fn().mockResolvedValue(undefined),
    fetchPublicUrl: jest.fn(),
  };
});

class MockNextResponse {
  readonly body: BodyInit | null;
  readonly headers: { get: (name: string) => string | null };
  readonly status: number;

  constructor(body: BodyInit | null, init?: ResponseInit) {
    const headerValues = new Map<string, string>();
    Object.entries(init?.headers ?? {}).forEach(([key, value]) => {
      headerValues.set(key.toLowerCase(), `${value}`);
    });
    this.body = body;
    this.headers = {
      get: (name: string) => headerValues.get(name.toLowerCase()) ?? null,
    };
    this.status = init?.status ?? 200;
  }

  static json(body: unknown, init?: ResponseInit): MockNextResponse {
    return new MockNextResponse(JSON.stringify(body), init);
  }

  async json(): Promise<unknown> {
    return JSON.parse(`${this.body}`);
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import { GET } from "@/app/api/wikimedia-card/route";
import { parseAcceptLanguage } from "@/app/api/wikimedia-card/target";
import { fetchPublicUrl } from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";

const mockFetchPublicUrl = fetchPublicUrl as jest.Mock;

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

const requestFor = (url: string, acceptLanguage?: string): NextRequest => {
  const headers = new Headers();
  if (acceptLanguage) {
    headers.set("accept-language", acceptLanguage);
  }
  return {
    nextUrl: new URL(
      `http://localhost/api/wikimedia-card?url=${encodeURIComponent(url)}`
    ),
    headers,
  } as unknown as NextRequest;
};

const requestedLanguages = (): Array<string | null> =>
  mockFetchPublicUrl.mock.calls.map(([, init]) =>
    (init.headers as Headers).get("accept-language")
  );

const mockLocalizedSummary = (canonicalPage: string) => {
  mockFetchPublicUrl.mockImplementation(
    async (_url: unknown, init: { headers: Headers }) => {
      const language = init.headers.get("accept-language");
      return jsonResponse({
        title: `title-${language}`,
        extract: `extract-${language}`,
        lang: language,
        content_urls: { desktop: { page: canonicalPage } },
      });
    }
  );
};

describe("wikimedia-card route", () => {
  beforeEach(() => {
    mockFetchPublicUrl.mockReset();
  });

  describe("response cache", () => {
    it("scopes cached cards to the requested languages", async () => {
      mockLocalizedSummary("https://en.wikipedia.org/wiki/Cache_scope");
      const pageUrl = "https://en.wikipedia.org/wiki/Cache_scope";

      const french = await (await GET(requestFor(pageUrl, "fr"))).json();
      const german = await (await GET(requestFor(pageUrl, "de"))).json();

      expect(french.title).toBe("title-fr");
      expect(german.title).toBe("title-de");
      expect(requestedLanguages()).toEqual(["fr", "de"]);
    });

    it("serves a repeated request in the same languages from the cache", async () => {
      mockLocalizedSummary("https://en.wikipedia.org/wiki/Cache_repeat");
      const pageUrl = "https://en.wikipedia.org/wiki/Cache_repeat";

      await GET(requestFor(pageUrl, "fr"));
      const cached = await GET(requestFor(pageUrl, "fr"));
      const cachedBody = await cached.json();

      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
      expect(cachedBody.title).toBe("title-fr");
    });

    it("treats equivalent Accept-Language spellings as one cache entry", async () => {
      mockLocalizedSummary("https://en.wikipedia.org/wiki/Cache_spelling");
      const pageUrl = "https://en.wikipedia.org/wiki/Cache_spelling";

      await GET(requestFor(pageUrl, "FR-ca, fr;q=0.9"));
      await GET(requestFor(pageUrl, "fr-ca,fr;q=0.9"));

      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    });

    it("does not reuse the canonical-URL entry across languages", async () => {
      mockLocalizedSummary("https://en.wikipedia.org/wiki/Cache_canonical");

      await GET(
        requestFor("https://en.m.wikipedia.org/wiki/Cache_canonical", "fr")
      );
      const sameLanguage = await GET(
        requestFor("https://en.wikipedia.org/wiki/Cache_canonical", "fr")
      );
      const otherLanguage = await GET(
        requestFor("https://en.wikipedia.org/wiki/Cache_canonical", "de")
      );

      expect((await sameLanguage.json()).title).toBe("title-fr");
      expect((await otherLanguage.json()).title).toBe("title-de");
      expect(requestedLanguages()).toEqual(["fr", "de"]);
    });

    it("does not cache unavailable cards", async () => {
      const pageUrl = "https://en.wikipedia.org/wiki/Cache_unavailable";
      mockFetchPublicUrl.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      const failed = await (await GET(requestFor(pageUrl, "fr"))).json();
      mockLocalizedSummary(pageUrl);
      const recovered = await (await GET(requestFor(pageUrl, "fr"))).json();
      const cached = await (await GET(requestFor(pageUrl, "fr"))).json();

      expect(failed.kind).toBe("unavailable");
      expect(recovered.title).toBe("title-fr");
      expect(cached.title).toBe("title-fr");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    });

    it("does not alias an unavailable card under its canonical URL", async () => {
      mockFetchPublicUrl.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      const failed = await (
        await GET(
          requestFor("https://en.m.wikipedia.org/wiki/Cache_unavailable_alias", "fr")
        )
      ).json();
      expect(failed.kind).toBe("unavailable");
      expect(failed.canonicalUrl).toBe(
        "https://en.wikipedia.org/wiki/Cache_unavailable_alias"
      );

      mockLocalizedSummary("https://en.wikipedia.org/wiki/Cache_unavailable_alias");
      const recovered = await (
        await GET(
          requestFor("https://en.wikipedia.org/wiki/Cache_unavailable_alias", "fr")
        )
      ).json();

      expect(recovered.title).toBe("title-fr");
      expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
    });

    it("marks card responses as varying by Accept-Language", async () => {
      mockLocalizedSummary("https://en.wikipedia.org/wiki/Cache_vary");
      const pageUrl = "https://en.wikipedia.org/wiki/Cache_vary";

      const fresh = await GET(requestFor(pageUrl, "fr"));
      const cached = await GET(requestFor(pageUrl, "fr"));

      expect(fresh.headers.get("vary")).toBe("Accept-Language");
      expect(cached.headers.get("vary")).toBe("Accept-Language");
    });
  });

  describe("commons license links", () => {
    const commonsResponse = (licenseUrl: string | undefined) =>
      jsonResponse({
        query: {
          pages: {
            "1": {
              title: "File:Example.jpg",
              imageinfo: [
                {
                  url: "https://upload.wikimedia.org/example.jpg",
                  extmetadata: {
                    LicenseShortName: { value: "CC BY-SA 4.0" },
                    ...(licenseUrl === undefined
                      ? {}
                      : { LicenseUrl: { value: licenseUrl } }),
                  },
                },
              ],
            },
          },
        },
      });

    // Every request needs its own file: the route caches cards per URL.
    let fileCounter = 0;
    const licenseUrlFor = async (licenseUrl?: string) => {
      mockFetchPublicUrl.mockResolvedValue(commonsResponse(licenseUrl));
      fileCounter += 1;
      const response = await GET(
        requestFor(
          `https://commons.wikimedia.org/wiki/File:License-${fileCounter}.jpg`
        )
      );
      const card = await response.json();
      expect(card.kind).toBe("commons-file");
      expect(card.license.name).toBe("CC BY-SA 4.0");
      return card.license.url;
    };

    it.each([
      [
        "https://creativecommons.org/licenses/by-sa/4.0",
        "https://creativecommons.org/licenses/by-sa/4.0",
      ],
      [
        "http://creativecommons.org/licenses/by/3.0/",
        "http://creativecommons.org/licenses/by/3.0/",
      ],
      [
        "  https://creativecommons.org/licenses/by/4.0  ",
        "https://creativecommons.org/licenses/by/4.0",
      ],
      [
        "HTTPS://creativecommons.org/publicdomain/zero/1.0/",
        "https://creativecommons.org/publicdomain/zero/1.0/",
      ],
    ])("keeps the http(s) license URL %p", async (value, expected) => {
      expect(await licenseUrlFor(value)).toBe(expected);
    });

    it.each([
      ["javascript:alert(1)"],
      ["JavaScript:alert(1)"],
      ["data:text/html,<p>license</p>"],
      ["vbscript:msgbox(1)"],
      ["file:///etc/passwd"],
      ["ftp://example.com/license"],
      ["//example.com/license"],
      ["/licenses/by-sa/4.0"],
      ["not a url"],
      [""],
    ])("drops the non-http(s) license URL %p", async (value) => {
      expect(await licenseUrlFor(value)).toBeNull();
    });

    it("returns no license URL when the metadata has none", async () => {
      expect(await licenseUrlFor()).toBeNull();
    });
  });
});

describe("parseAcceptLanguage", () => {
  it("defaults to English without a header", () => {
    expect(parseAcceptLanguage(null)).toEqual(["en"]);
  });

  it("orders by quality, adds base languages and always ends with English", () => {
    expect(parseAcceptLanguage("fr-CA, de;q=0.5, es;q=0.9")).toEqual([
      "fr-ca",
      "fr",
      "es",
      "de",
      "en",
    ]);
  });

  it("limits how many entries can influence the language list", () => {
    const header = Array.from(
      { length: 40 },
      (_value, index) => `x${index}`
    ).join(",");

    expect(parseAcceptLanguage(header)).toEqual([
      "x0",
      "x1",
      "x2",
      "x3",
      "x4",
      "en",
    ]);
  });
});
