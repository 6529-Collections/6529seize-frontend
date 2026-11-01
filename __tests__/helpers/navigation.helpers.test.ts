import {
  getActiveWaveIdFromUrl,
  getEncryptedConversationIdFromPathname,
  getEncryptedConversationRoute,
  getEncryptedDevicesRoute,
  getEncryptedMessagesRoute,
  getMessageIdFromPathname,
  getNewEncryptedChatRoute,
  getWaveHomeRoute,
  getWaveIdFromPathname,
  getWaveRoute,
  getWaveRouteWithSearchParams,
  hidesMobileBottomNavigation,
  isEncryptedMessagesPathname,
  mainSegment,
  sameMainPath,
  usesReverseMobileBottomNavigationScroll,
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

    it("returns messages wave route when isDirectMessage is true", () => {
      const result = getWaveRoute({
        waveId: "dm-456",
        isDirectMessage: true,
        isApp: false,
      });
      expect(result).toBe("/messages/dm-456");
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

    it("keeps serialNo as a query param on direct message wave routes", () => {
      const result = getWaveRoute({
        waveId: "dm-456",
        serialNo: 5,
        isDirectMessage: true,
        isApp: false,
      });
      expect(result).toBe("/messages/dm-456?serialNo=5");
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

  describe("getWaveRouteWithSearchParams", () => {
    it("preserves query params when redirecting to canonical waves route", () => {
      const result = getWaveRouteWithSearchParams({
        waveId: "wave-123",
        searchParams: {
          wave: "legacy-wave",
          drop: "drop-1",
          divider: "7",
        },
        isDirectMessage: false,
      });

      expect(result).toBe("/waves/wave-123?drop=drop-1&divider=7");
    });

    it("preserves repeated query params when redirecting to messages route", () => {
      const result = getWaveRouteWithSearchParams({
        waveId: "dm-123",
        searchParams: {
          wave: "legacy-wave",
          tag: ["one", "two"],
        },
        isDirectMessage: true,
      });

      expect(result).toBe("/messages/dm-123?tag=one&tag=two");
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

  describe("getMessageIdFromPathname", () => {
    it("returns wave id from canonical messages path", () => {
      expect(getMessageIdFromPathname("/messages/dm-123")).toBe("dm-123");
    });

    it("returns null for messages create route", () => {
      expect(getMessageIdFromPathname("/messages/create")).toBeNull();
    });

    it("never reads encrypted chat routes as a plaintext wave id", () => {
      expect(getMessageIdFromPathname("/messages/encrypted")).toBeNull();
      expect(getMessageIdFromPathname("/messages/encrypted/new")).toBeNull();
      expect(
        getMessageIdFromPathname(`/messages/encrypted/0x${"a".repeat(64)}`)
      ).toBeNull();
      expect(
        getActiveWaveIdFromUrl({
          pathname: `/messages/encrypted/0x${"a".repeat(64)}`,
        })
      ).toBeNull();
    });
  });

  describe("encrypted chat routes", () => {
    const group = `0x${"b".repeat(64)}`;

    it("builds the encrypted routes", () => {
      expect(getEncryptedMessagesRoute()).toBe("/messages/encrypted");
      expect(getNewEncryptedChatRoute()).toBe("/messages/encrypted/new");
      expect(getEncryptedDevicesRoute()).toBe("/messages/encrypted/devices");
      expect(getEncryptedConversationRoute(group)).toBe(
        `/messages/encrypted/${group}`
      );
    });

    it("recognizes encrypted pathnames", () => {
      expect(isEncryptedMessagesPathname("/messages/encrypted")).toBe(true);
      expect(isEncryptedMessagesPathname("/messages/encrypted/new")).toBe(
        true
      );
      expect(isEncryptedMessagesPathname("/messages/encrypted-x")).toBe(false);
      expect(isEncryptedMessagesPathname("/messages/dm-1")).toBe(false);
      expect(isEncryptedMessagesPathname(null)).toBe(false);
    });

    it("extracts only conversation handles", () => {
      expect(
        getEncryptedConversationIdFromPathname(`/messages/encrypted/${group}`)
      ).toBe(group);
      expect(
        getEncryptedConversationIdFromPathname("/messages/encrypted/new")
      ).toBeNull();
      expect(
        getEncryptedConversationIdFromPathname("/messages/encrypted/devices")
      ).toBeNull();
      expect(
        getEncryptedConversationIdFromPathname("/messages/encrypted")
      ).toBeNull();
      expect(
        getEncryptedConversationIdFromPathname("/messages/encrypted/")
      ).toBeNull();
      expect(getEncryptedConversationIdFromPathname("/messages/dm")).toBeNull();
    });

    it("hides the mobile dock only inside an encrypted conversation", () => {
      expect(
        hidesMobileBottomNavigation({
          pathname: `/messages/encrypted/${group}`,
        })
      ).toBe(true);
      expect(
        hidesMobileBottomNavigation({ pathname: "/messages/encrypted" })
      ).toBe(false);
      expect(
        hidesMobileBottomNavigation({ pathname: "/messages/encrypted/new" })
      ).toBe(false);
    });
  });

  describe("hidesMobileBottomNavigation", () => {
    it("hides on canonical wave/message detail routes and the create-wave flow", () => {
      expect(hidesMobileBottomNavigation({ pathname: "/waves/wave-123" })).toBe(
        true
      );
      expect(
        hidesMobileBottomNavigation({ pathname: "/messages/dm-123" })
      ).toBe(true);
      // Create-wave is a focused full-screen flow with its own sticky footer.
      expect(hidesMobileBottomNavigation({ pathname: "/waves/create" })).toBe(
        true
      );
    });

    it("keeps the dock on list routes", () => {
      expect(hidesMobileBottomNavigation({ pathname: "/waves" })).toBe(false);
      expect(hidesMobileBottomNavigation({ pathname: "/messages" })).toBe(
        false
      );
    });

    it("hides the dock while composing a new direct message", () => {
      expect(
        hidesMobileBottomNavigation({ pathname: "/messages/create" })
      ).toBe(true);
    });
  });

  describe("usesReverseMobileBottomNavigationScroll", () => {
    it("uses reversed scroll behavior on notifications routes", () => {
      expect(
        usesReverseMobileBottomNavigationScroll({ pathname: "/notifications" })
      ).toBe(true);
      expect(
        usesReverseMobileBottomNavigationScroll({
          pathname: "/notifications/settings",
        })
      ).toBe(true);
      expect(
        usesReverseMobileBottomNavigationScroll({ pathname: "/waves" })
      ).toBe(false);
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

    it("prefers pathname message id over legacy wave query param", () => {
      const searchParams = new URLSearchParams({ wave: "legacy-wave" });
      const result = getActiveWaveIdFromUrl({
        pathname: "/messages/canonical-dm",
        searchParams,
      });
      expect(result).toBe("canonical-dm");
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
