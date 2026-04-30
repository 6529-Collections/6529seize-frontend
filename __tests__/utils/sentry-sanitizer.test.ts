import { sanitizeSentryBreadcrumb } from "@/utils/sentry-sanitizer";

describe("sentry-sanitizer", () => {
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
      })
    );
  });
});
