describe("SeizeLinkParser with mocked BASE_ENDPOINT", () => {
  let parseSeizeQuoteLink: any;
  let parseSeizeQueryLink: any;
  let ensureStableSeizeLink: any;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("@/config/env", () => ({
      publicEnv: {
        BASE_ENDPOINT: "https://site.com",
      },
    }));
    // Now import the module under test AFTER the mock is in place
    ({
      parseSeizeQuoteLink,
      parseSeizeQueryLink,
      ensureStableSeizeLink,
    } = require("@/helpers/SeizeLinkParser"));
  });

  describe("parseSeizeQuoteLink", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";

    it("parses valid link", () => {
      const res = parseSeizeQuoteLink(`/waves?wave=${uuid}&serialNo=10`);
      expect(res).toEqual({ waveId: uuid, serialNo: "10" });
    });

    it("parses serial link with trailing slash", () => {
      const res = parseSeizeQuoteLink(`/waves?wave=${uuid}&serialNo=10/`);
      expect(res).toEqual({ waveId: uuid, serialNo: "10" });
    });

    it("returns null for drop-based quote link", () => {
      const res = parseSeizeQuoteLink(`/waves?wave=${uuid}&drop=drop-123`);
      expect(res).toBeNull();
    });

    it("returns null for drop-based quote link with trailing slash", () => {
      const res = parseSeizeQuoteLink(`/waves?wave=${uuid}&drop=drop-123/`);
      expect(res).toBeNull();
    });

    it("returns null for legacy my-stream link", () => {
      const res = parseSeizeQuoteLink(`/my-stream?wave=${uuid}&serialNo=10`);
      expect(res).toBeNull();
    });

    it("returns null for invalid wave id", () => {
      expect(parseSeizeQuoteLink("/waves?wave=not-a-uuid&serialNo=10")).toBeNull();
    });

    it("returns null when neither serial nor drop provided", () => {
      expect(parseSeizeQuoteLink(`/waves?wave=${uuid}`)).toBeNull();
    });

    it("returns null for invalid link", () => {
      expect(parseSeizeQuoteLink("/wrong")).toBeNull();
    });
  });

  describe("parseSeizeQueryLink", () => {
    it("parses query parameters when all present", () => {
      const res = parseSeizeQueryLink(
        "https://site.com/path?foo=1&bar=2",
        "/path",
        ["foo", "bar"]
      );
      expect(res).toEqual({ foo: "1", bar: "2" });
    });

    it("returns null for mismatched path", () => {
      const res = parseSeizeQueryLink("https://site.com/other?foo=1", "/path", [
        "foo",
      ]);
      expect(res).toBeNull();
    });

    it("returns null when host does not match mocked BASE_ENDPOINT", () => {
      const res = parseSeizeQueryLink(
        "https://example.com/path?foo=1",
        "/path",
        ["foo"]
      );
      expect(res).toBeNull();
    });

    it("requires exact path match", () => {
      const res = parseSeizeQueryLink(
        "https://site.com/alias?foo=1",
        "/path",
        ["foo"]
      );
      expect(res).toBeNull();
    });

    it("respects exact parameter when extra query present", () => {
      const res = parseSeizeQueryLink(
        "https://site.com/path?foo=1&bar=2",
        "/path",
        ["foo"],
        true
      );
      expect(res).toBeNull();
    });
  });

  describe("ensureStableSeizeLink", () => {
    it("returns original href for non-base URLs", () => {
      const incoming = "https://othersite.com/?drop=drop-id";
      const current = "https://site.com/messages?wave=abc";
      expect(ensureStableSeizeLink(incoming, current)).toBe(incoming);
    });

    it("returns original href when drop param missing", () => {
      const incoming = "https://site.com/";
      const current = "https://site.com/messages?wave=abc";
      expect(ensureStableSeizeLink(incoming, current)).toBe(incoming);
    });

    it("rewrites root drop link to current path with drop param", () => {
      const incoming = "https://site.com/?drop=drop-id";
      const current = "https://site.com/messages?wave=abc";
      expect(ensureStableSeizeLink(incoming, current)).toBe(
        "https://site.com/messages?wave=abc&drop=drop-id"
      );
    });

    it("handles relative drop links", () => {
      const incoming = "?drop=drop-id";
      const current = "https://site.com/messages";
      expect(ensureStableSeizeLink(incoming, current)).toBe(
        "https://site.com/messages?drop=drop-id"
      );
    });

    it("preserves existing query params and replaces drop", () => {
      const incoming = "https://site.com/?drop=new-drop";
      const current = "https://site.com/messages?wave=abc&drop=old-drop";
      expect(ensureStableSeizeLink(incoming, current)).toBe(
        "https://site.com/messages?wave=abc&drop=new-drop"
      );
    });

    it("rebases drop links from other paths onto current location", () => {
      const incoming = "https://site.com/waves?wave=abc&drop=def";
      const current = "https://site.com/messages?wave=xyz";
      expect(ensureStableSeizeLink(incoming, current)).toBe(
        "https://site.com/messages?wave=xyz&drop=def"
      );
    });

    it("refreshes cached origin when BASE_ENDPOINT changes", () => {
      const { publicEnv } = require("@/config/env");

      expect(
        ensureStableSeizeLink(
          "https://site.com/?drop=drop-1",
          "https://site.com/messages"
        )
      ).toBe("https://site.com/messages?drop=drop-1");

      publicEnv.BASE_ENDPOINT = "https://other.com";
      try {
        expect(
          ensureStableSeizeLink(
            "https://other.com/?drop=drop-2",
            "https://other.com/messages"
          )
        ).toBe("https://other.com/messages?drop=drop-2");
      } finally {
        publicEnv.BASE_ENDPOINT = "https://site.com";
      }
    });
  });
});
