import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  sanitizeSentrySpan,
  sanitizeUrlString,
} from "@/utils/sentry-sanitizer";

const SYNTHETIC_WAVE_ID = `${"1".repeat(8)}-${"2".repeat(4)}-4${"3".repeat(3)}-8${"4".repeat(3)}-${"5".repeat(12)}`;
const SYNTHETIC_DROP_ID = `${"6".repeat(8)}-${"7".repeat(4)}-4${"8".repeat(3)}-8${"9".repeat(3)}-${"a".repeat(12)}`;
const SYNTHETIC_AUTHOR_ID = `${"a".repeat(8)}-${"b".repeat(4)}-4${"c".repeat(3)}-8${"d".repeat(3)}-${"e".repeat(12)}`;
const SYNTHETIC_WALLET = `0x${"f".repeat(40)}`;
const SYNTHETIC_PROFILE = "synthetic-public-profile";
const SYNTHETIC_MEDIA_ID = "synthetic-media-file";

describe("sentry-sanitizer", () => {
  it("redacts secrets from breadcrumb text fields", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      message: "request failed Bearer abc123",
      category: "fetch pk_1234567890abcdef",
      type: "http Basic dGVzdA",
    });

    expect(breadcrumb).toEqual(
      expect.objectContaining({
        message: "request failed Bearer [Filtered]",
        category: "fetch [Filtered]",
        type: "http Basic [Filtered]",
      })
    );
  });

  it("strips third-party breadcrumb URLs to paths and marks them as non-first-party", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "https://example.com/api/waves-overview?token=secret#hash",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/api/waves-overview",
        "url.is_first_party": false,
      })
    );
    expect(breadcrumb?.data).not.toHaveProperty("url.host_family");
  });

  it("marks first-party absolute breadcrumb URLs before stripping the host", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "https://api.6529.io/api/waves-overview?foo=bar",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/api/waves-overview",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      })
    );
  });

  it("marks api.6529.io breadcrumb URLs as first-party API before stripping the host", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "https://api.6529.io/oracle/prenodes?page=1",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/oracle/prenodes",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      })
    );
  });

  it.each(["staging", "test"])(
    "marks api.%s.6529.io breadcrumb URLs as first-party API before stripping the host",
    (environment) => {
      const breadcrumb = sanitizeSentryBreadcrumb({
        type: "http",
        category: "fetch",
        data: {
          url: `https://api.${environment}.6529.io/alchemy-proxy?chainId=1#hash`,
        },
      });

      expect(breadcrumb?.data).toEqual(
        expect.objectContaining({
          url: "/alchemy-proxy",
          "url.is_first_party": true,
          "url.is_first_party_api": true,
        })
      );
    }
  );

  it("does not mark allowlist-api environment subdomains as first-party API hosts", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "https://allowlist-api.staging.6529.io/alchemy-proxy?chainId=1#hash",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/alchemy-proxy",
        "url.is_first_party": true,
        "url.is_first_party_api": false,
      })
    );
  });

  it("marks relative breadcrumb URLs as first-party", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "/api/waves-overview?foo=bar",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/api/waves-overview",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      })
    );
  });

  it("does not mark redacted breadcrumb URL placeholders as first-party", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "[Filtered]",
      },
    });

    expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party");
    expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party_api");
    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "[Filtered]",
      })
    );
  });

  it("does not mark unknown breadcrumb URL placeholders as first-party", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "unknown",
      },
    });

    expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party");
    expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party_api");
    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "unknown",
      })
    );
  });

  it.each(["/[Filtered]", "/%5BFiltered%5D", "/unknown"])(
    "does not mark already-sanitized breadcrumb URL placeholder %s as first-party",
    (url) => {
      const breadcrumb = sanitizeSentryBreadcrumb({
        type: "http",
        category: "fetch",
        data: {
          url,
        },
      });

      expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party");
      expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party_api");
    }
  );

  it.each(["[Filtered]", "unknown"])(
    "does not add first-party metadata to %s after breadcrumb and event sanitize passes",
    (url) => {
      const breadcrumb = sanitizeSentryBreadcrumb({
        type: "http",
        category: "fetch",
        data: {
          url,
        },
      });

      const event = sanitizeSentryEvent({
        breadcrumbs: [breadcrumb!],
      });
      const data = event.breadcrumbs?.[0]?.data;

      expect(data).toEqual(
        expect.objectContaining({
          url,
        })
      );
      expect(data).not.toHaveProperty("url.is_first_party");
      expect(data).not.toHaveProperty("url.is_first_party_api");
    }
  );

  it.each(["[Redacted]", "filtered"])(
    "does not mark unusable breadcrumb URL token %s as first-party",
    (url) => {
      const breadcrumb = sanitizeSentryBreadcrumb({
        type: "http",
        category: "fetch",
        data: {
          url,
        },
      });

      expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party");
      expect(breadcrumb?.data).not.toHaveProperty("url.is_first_party_api");
      expect(breadcrumb?.data).toEqual(
        expect.objectContaining({
          url,
        })
      );
    }
  );

  it("keeps neutral refresh telemetry aliases while redacting auth/session-prefixed legacy keys in event data", () => {
    const event = sanitizeSentryEvent({
      extra: {
        auth_refresh_outcome: "unauthorized",
        session_refresh_result: "unauthorized",
        refresh_result: "unauthorized",
        refresh_client_type: "web",
        refresh_status_bucket: "http_401",
        refresh_status_code: 401,
        refresh_authorization: "Bearer secret-token",
        refresh_token: "secret-refresh-token",
      },
    });

    expect(event.extra).toEqual(
      expect.objectContaining({
        auth_refresh_outcome: "[Filtered]",
        session_refresh_result: "[Filtered]",
        refresh_result: "unauthorized",
        refresh_client_type: "web",
        refresh_status_bucket: "http_401",
        refresh_status_code: 401,
        refresh_authorization: "[Filtered]",
        refresh_token: "[Filtered]",
      })
    );
  });

  it("marks bare API paths as first-party API breadcrumb URLs", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "api/waves-overview",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/api/waves-overview",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      })
    );
  });

  it("marks bare asset paths as first-party non-API breadcrumb URLs", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "assets/app.js",
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/assets/app.js",
        "url.is_first_party": true,
        "url.is_first_party_api": false,
      })
    );
  });

  it("keeps existing breadcrumb URL origin metadata on later sanitize passes", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "/api/waves-overview",
        "url.is_first_party": false,
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/api/waves-overview",
        "url.is_first_party": false,
        "url.is_first_party_api": false,
      })
    );
  });

  it("keeps existing breadcrumb first-party API metadata on later sanitize passes", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: "/oracle/prenodes",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      },
    });

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/oracle/prenodes",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      })
    );
  });

  it("normalizes automatic API breadcrumbs without losing request outcome fields", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        method: "GET",
        status_code: 503,
        duration: 321,
        url: `https://api.6529.io/api/v2/waves/${SYNTHETIC_WAVE_ID}/drops/${SYNTHETIC_DROP_ID}?access_token=synthetic#private`,
      },
    });
    const payload = JSON.stringify(breadcrumb);

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        method: "GET",
        status_code: 503,
        duration: 321,
        url: "/api/v2/waves/:uuid/drops/:uuid",
        "url.is_first_party": true,
        "url.is_first_party_api": true,
      })
    );
    expect(payload).not.toContain(SYNTHETIC_WAVE_ID);
    expect(payload).not.toContain(SYNTHETIC_DROP_ID);
    expect(payload).not.toContain("access_token");
    expect(payload).not.toContain("#private");
  });

  it("normalizes automatic HTTP spans while preserving method, status, origin, and timing", () => {
    const span = sanitizeSentrySpan({
      op: "http.client",
      description: `GET https://api.6529.io/api/v2/waves/${SYNTHETIC_WAVE_ID}/drops?access_token=synthetic#private`,
      start_timestamp: 10,
      timestamp: 10.25,
      exclusive_time: 250,
      data: {
        url: `/api/v2/waves/${SYNTHETIC_WAVE_ID}/drops?access_token=synthetic#private`,
        "http.url": `https://api.6529.io/api/v2/waves/${SYNTHETIC_WAVE_ID}/drops?access_token=synthetic#private`,
        "http.method": "GET",
        "http.response.status_code": 503,
        "http.query": "?access_token=synthetic",
        "http.fragment": "#private",
        "http.host": "api.6529.io:443",
        "server.address": "api.6529.io",
        "sentry.origin": "auto.http.browser",
        "url.domain": "6529.io",
        "url.same_origin": false,
      },
    });
    const payload = JSON.stringify(span);

    expect(span).toEqual(
      expect.objectContaining({
        description: "GET /api/v2/waves/:uuid/drops",
        start_timestamp: 10,
        timestamp: 10.25,
        exclusive_time: 250,
      })
    );
    expect(span.data).toEqual(
      expect.objectContaining({
        url: "/api/v2/waves/:uuid/drops",
        "http.url": "/api/v2/waves/:uuid/drops",
        "http.host": "first-party-api",
        "http.method": "GET",
        "http.response.status_code": 503,
        "server.address": "first-party-api",
        "sentry.origin": "auto.http.browser",
        "url.domain": "first-party-app",
        "url.same_origin": false,
      })
    );
    expect(span.data).not.toHaveProperty("http.query");
    expect(span.data).not.toHaveProperty("http.fragment");
    expect(payload).not.toContain(SYNTHETIC_WAVE_ID);
    expect(payload).not.toContain("access_token");
    expect(payload).not.toContain("#private");
  });

  it("normalizes author and media identifiers in resource span paths", () => {
    const span = sanitizeSentrySpan({
      op: "resource.video",
      description: `https://media.example.invalid/renditions/drops/author_${SYNTHETIC_AUTHOR_ID}/${SYNTHETIC_MEDIA_ID}/hls/file.m3u8?token=synthetic#private`,
      data: {
        "http.response.status_code": 404,
        "url.same_origin": false,
      },
    });
    const payload = JSON.stringify(span);

    expect(span.description).toBe("/renditions/drops/:id/:id/hls/file.m3u8");
    expect(span.data).toEqual(
      expect.objectContaining({
        "http.response.status_code": 404,
        "url.same_origin": false,
      })
    );
    expect(payload).not.toContain(SYNTHETIC_AUTHOR_ID);
    expect(payload).not.toContain(SYNTHETIC_MEDIA_ID);
    expect(payload).not.toContain("token=");
  });

  it("omits third-party hosts while retaining sanitized path families", () => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: {
        url: `https://media.example.invalid/renditions/drops/author_${SYNTHETIC_AUTHOR_ID}/${SYNTHETIC_MEDIA_ID}?token=synthetic`,
      },
    });
    const payload = JSON.stringify(breadcrumb);

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/renditions/drops/:id/:id",
        "url.is_first_party": false,
      })
    );
    expect(breadcrumb?.data).not.toHaveProperty("url.host_family");
    expect(payload).not.toContain(SYNTHETIC_AUTHOR_ID);
    expect(payload).not.toContain(SYNTHETIC_MEDIA_ID);
    expect(payload).not.toContain("token=");
  });

  it.each([
    [
      "https://synthetic-profile.example.invalid/assets/app.js?token=synthetic",
      "synthetic-profile",
    ],
    [
      "https://synthetic-profile.example.co.uk/assets/app.js?token=synthetic",
      "synthetic-profile.example.co.uk",
    ],
    ["https://192.0.2.10/assets/app.js?token=synthetic", "192.0.2.10"],
    ["http://localhost:8080/assets/app.js?token=synthetic", "localhost"],
  ])("does not retain the raw host from %s", (url, rawHost) => {
    const breadcrumb = sanitizeSentryBreadcrumb({
      type: "http",
      category: "fetch",
      data: { url },
    });
    const payload = JSON.stringify(breadcrumb);

    expect(breadcrumb?.data).toEqual(
      expect.objectContaining({
        url: "/assets/app.js",
        "url.is_first_party": false,
      })
    );
    expect(breadcrumb?.data).not.toHaveProperty("url.host_family");
    expect(payload).not.toContain(rawHost);
    expect(payload).not.toContain("token=");
  });

  it("generalizes arbitrary automatic span host fields", () => {
    const span = sanitizeSentrySpan({
      op: "http.client",
      description:
        "GET https://synthetic-profile.example.invalid/assets/app.js?token=synthetic",
      data: {
        duration: 125,
        "http.host": "192.0.2.10:443",
        "http.method": "GET",
        "http.response.status_code": 502,
        "server.address": "synthetic-profile.example.invalid",
        "url.domain": "synthetic-profile.example.co.uk",
      },
    });
    const payload = JSON.stringify(span);

    expect(span).toEqual(
      expect.objectContaining({
        description: "GET /assets/app.js",
        data: expect.objectContaining({
          duration: 125,
          "http.host": "third-party",
          "http.method": "GET",
          "http.response.status_code": 502,
          "server.address": "third-party",
          "url.domain": "third-party",
        }),
      })
    );
    expect(payload).not.toContain("synthetic-profile");
    expect(payload).not.toContain("example.co.uk");
    expect(payload).not.toContain("192.0.2.10");
    expect(payload).not.toContain("token=");
  });

  it("keeps static resource spans as static endpoint families", () => {
    const span = sanitizeSentrySpan({
      op: "resource.script",
      description:
        "https://6529.io/_next/static/chunks/app.js?cache=synthetic#private",
      data: {
        "server.address": "6529.io",
        "url.same_origin": true,
      },
    });

    expect(span).toEqual(
      expect.objectContaining({
        description: "/_next/static/chunks/app.js",
        data: expect.objectContaining({
          "server.address": "first-party-app",
          "url.same_origin": true,
        }),
      })
    );
  });

  it("normalizes profile transactions and wallet endpoint requests in events", () => {
    const event = sanitizeSentryEvent({
      transaction: `/${SYNTHETIC_PROFILE}/collected?access_token=synthetic`,
      request: {
        method: "GET",
        url: `https://api.6529.io/identities/by-wallet/${SYNTHETIC_WALLET}?access_token=synthetic#private`,
      },
    });
    const payload = JSON.stringify(event);

    expect(event.transaction).toBe("/[user]/collected");
    expect(event.request).toEqual(
      expect.objectContaining({
        method: "GET",
        url: "/identities/by-wallet/:wallet",
      })
    );
    expect(payload).not.toContain(SYNTHETIC_PROFILE);
    expect(payload).not.toContain(SYNTHETIC_WALLET);
    expect(payload).not.toContain("access_token");
    expect(payload).not.toContain("#private");
  });

  it.each([
    [
      "https://api.6529.io/api/waves-overview?cache=synthetic#private",
      "/api/waves-overview",
    ],
    [
      "https://api.6529.io/drop-media/multipart-upload/completion?cache=synthetic",
      "/drop-media/multipart-upload/completion",
    ],
    ["https://6529.io/about/media?cache=synthetic", "/about/media"],
    ["https://6529.io/waves/create?cache=synthetic", "/waves/create"],
    [
      "https://6529.io/_next/static/chunks/app.js?cache=synthetic",
      "/_next/static/chunks/app.js",
    ],
  ])("keeps the public static or API family for %s", (url, expected) => {
    expect(sanitizeUrlString(url)).toBe(expected);
  });

  it("is idempotent for already-normalized route and endpoint placeholders", () => {
    const endpoint = "/api/v2/waves/:uuid/drops/:uuid";
    const route = "/[user]/collected";

    expect(sanitizeUrlString(sanitizeUrlString(endpoint))).toBe(endpoint);
    expect(sanitizeSentryEvent({ transaction: route }).transaction).toBe(route);
  });
});
