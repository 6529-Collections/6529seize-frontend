import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "@/utils/sentry-sanitizer";

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
});
