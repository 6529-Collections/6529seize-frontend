describe("SeizeLinkParser with mocked BASE_ENDPOINT", () => {
  let parseSeizeQuoteLink: any;
  let parseSeizeQueryLink: any;

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
    } = require("@/helpers/SeizeLinkParser"));
  });

  describe("parseSeizeQuoteLink", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";

    it("parses valid link", () => {
      const res = parseSeizeQuoteLink(`/waves?wave=${uuid}&serialNo=10`);
      expect(res).toEqual({ waveId: uuid, serialNo: "10", dropId: undefined });
    });

    it("returns null for legacy my-stream link", () => {
      const res = parseSeizeQuoteLink(`/my-stream?wave=${uuid}&serialNo=10`);
      expect(res).toBeNull();
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
});
