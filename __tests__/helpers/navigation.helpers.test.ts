import {
  getActiveWaveIdFromUrl,
  getWaveHomeRoute,
  getWaveIdFromPathname,
  getWaveRoute,
  mainSegment,
  sameMainPath,
} from "@/helpers/navigation.helpers";

describe("navigation.helpers", () => {
  describe("mainSegment", () => {
    it("returns lowercase first path segment", () => {
      expect(mainSegment("/Foo/Bar")).toBe("/foo");
    });

    it("ignores query and hash", () => {
      expect(mainSegment("/TEST/path?x=1#hash")).toBe("/test");
    });

    it("returns root for empty path", () => {
      expect(mainSegment("/")).toBe("/");
      expect(mainSegment("")).toBe("/");
    });
  });

  describe("sameMainPath", () => {
    it("compares main segments case-insensitively", () => {
      expect(sameMainPath("/Foo/a", "/foo/b")).toBe(true);
    });

    it("detects different segments", () => {
      expect(sameMainPath("/one", "/two")).toBe(false);
    });
  });

  describe("getWaveRoute", () => {
    it("returns wave route with waveId", () => {
      const result = getWaveRoute({
        waveId: "wave-123",
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave-123");
    });

    it("returns messages route when isDirectMessage is true", () => {
      const result = getWaveRoute({
        waveId: "dm-456",
        isDirectMessage: true,
        isApp: false,
      });
      expect(result).toBe("/messages?wave=dm-456");
    });

    it("includes serialNo when provided as number", () => {
      const result = getWaveRoute({
        waveId: "wave-123",
        serialNo: 42,
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave-123?serialNo=42");
    });

    it("includes serialNo when provided as string", () => {
      const result = getWaveRoute({
        waveId: "wave-123",
        serialNo: "99",
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave-123?serialNo=99");
    });

    it("does not include serialNo when undefined", () => {
      const result = getWaveRoute({
        waveId: "wave-123",
        serialNo: undefined,
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave-123");
    });

    it("includes extraParams and serialNo on canonical wave route", () => {
      const result = getWaveRoute({
        waveId: "wave-123",
        serialNo: 10,
        extraParams: { foo: "bar", baz: "qux" },
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave-123?foo=bar&baz=qux&serialNo=10");
    });

    it("ignores undefined extraParams values", () => {
      const result = getWaveRoute({
        waveId: "wave-123",
        extraParams: { keep: "this", remove: undefined },
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave-123?keep=this");
    });

    it("encodes special characters in query params", () => {
      const result = getWaveRoute({
        waveId: "wave&id=special",
        serialNo: 5,
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves/wave%26id%3Dspecial?serialNo=5");
    });
  });

  describe("getWaveHomeRoute", () => {
    it("returns /waves for non-direct messages", () => {
      const result = getWaveHomeRoute({
        isDirectMessage: false,
        isApp: false,
      });
      expect(result).toBe("/waves");
    });

    it("returns /messages for direct messages", () => {
      const result = getWaveHomeRoute({
        isDirectMessage: true,
        isApp: false,
      });
      expect(result).toBe("/messages");
    });
  });

  describe("getWaveIdFromPathname", () => {
    it("returns wave id from canonical waves path", () => {
      expect(getWaveIdFromPathname("/waves/wave-123")).toBe("wave-123");
    });

    it("returns null for waves create route", () => {
      expect(getWaveIdFromPathname("/waves/create")).toBeNull();
    });
  });

  describe("getActiveWaveIdFromUrl", () => {
    it("prefers pathname wave id over legacy wave query param", () => {
      const searchParams = new URLSearchParams({ wave: "legacy-wave" });
      const result = getActiveWaveIdFromUrl({
        pathname: "/waves/canonical-wave",
        searchParams,
      });
      expect(result).toBe("canonical-wave");
    });

    it("falls back to legacy query wave id when pathname is not wave-specific", () => {
      const searchParams = new URLSearchParams({ wave: "legacy-wave" });
      const result = getActiveWaveIdFromUrl({
        pathname: "/waves",
        searchParams,
      });
      expect(result).toBe("legacy-wave");
    });
  });
});
