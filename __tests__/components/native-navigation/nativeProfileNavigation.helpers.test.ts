import {
  getNativeProfileHistoryValue,
  getNativeProfileTarget,
  isNativeProfileOverlaySource,
  NATIVE_PROFILE_HISTORY_STATE_KEY,
  NATIVE_PROFILE_STACK_LIMIT,
  withNativeProfileHistoryValue,
} from "@/components/native-navigation/nativeProfileNavigation.helpers";

describe("nativeProfileNavigation helpers", () => {
  describe("isNativeProfileOverlaySource", () => {
    it("allows waves and messages routes", () => {
      expect(isNativeProfileOverlaySource("/waves", "")).toBe(true);
      expect(isNativeProfileOverlaySource("/waves/wave-id", "?serialNo=4")).toBe(
        true
      );
      expect(isNativeProfileOverlaySource("/messages", "")).toBe(true);
      expect(isNativeProfileOverlaySource("/messages/dm-id", "")).toBe(true);
    });

    it("allows stream-style home URLs", () => {
      expect(isNativeProfileOverlaySource("/", "?view=waves")).toBe(true);
      expect(isNativeProfileOverlaySource("/", "?view=messages")).toBe(true);
      expect(isNativeProfileOverlaySource("/", "?wave=abc")).toBe(true);
    });

    it("rejects non-stream routes", () => {
      expect(isNativeProfileOverlaySource("/alice", "")).toBe(false);
      expect(isNativeProfileOverlaySource("/about", "")).toBe(false);
      expect(isNativeProfileOverlaySource("/", "")).toBe(false);
    });
  });

  describe("getNativeProfileTarget", () => {
    it("keeps profile path, query params, and hash", () => {
      expect(
        getNativeProfileTarget({
          href: "https://6529.io/Alice/curations?tab=owned#drop-1",
          origin: "https://6529.io",
        })
      ).toEqual({
        href: "/Alice/curations?tab=owned#drop-1",
        user: "Alice",
      });
    });

    it("rejects external and reserved app routes", () => {
      expect(
        getNativeProfileTarget({
          href: "https://example.com/alice",
          origin: "https://6529.io",
        })
      ).toBeNull();
      expect(
        getNativeProfileTarget({
          href: "https://6529.io/waves/abc",
          origin: "https://6529.io",
        })
      ).toBeNull();
      expect(
        getNativeProfileTarget({
          href: "https://6529.io/about",
          origin: "https://6529.io",
        })
      ).toBeNull();
    });
  });

  describe("history state", () => {
    it("stores the native stack under a namespaced key", () => {
      const historyValue = {
        background: { pathname: "/waves", search: "?serialNo=1" },
        stack: [{ id: "1", href: "/alice", user: "alice" }],
      };

      const state = withNativeProfileHistoryValue(
        { existing: true },
        historyValue
      );

      expect(state.existing).toBe(true);
      expect(state[NATIVE_PROFILE_HISTORY_STATE_KEY]).toEqual(historyValue);
      expect(getNativeProfileHistoryValue(state)).toEqual(historyValue);
    });

    it("caps parsed stack entries", () => {
      const stack = Array.from({ length: NATIVE_PROFILE_STACK_LIMIT + 2 }).map(
        (_, index) => ({
          id: `${index}`,
          href: `/user-${index}`,
          user: `user-${index}`,
        })
      );

      const parsed = getNativeProfileHistoryValue(
        withNativeProfileHistoryValue(
          { existing: true },
          {
            background: { pathname: "/messages", search: "" },
            stack,
          }
        )
      );

      expect(parsed?.stack).toHaveLength(NATIVE_PROFILE_STACK_LIMIT);
      expect(parsed?.stack[0]?.user).toBe("user-2");
    });
  });
});
