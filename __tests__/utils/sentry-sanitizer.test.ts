import { sanitizeSentryBreadcrumb } from "@/utils/sentry-sanitizer";

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
