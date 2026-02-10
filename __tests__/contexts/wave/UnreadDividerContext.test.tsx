import {
  UnreadDividerProvider,
  useUnreadDivider,
  useUnreadDividerOptional,
} from "@/contexts/wave/UnreadDividerContext";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

function createWrapper(initialSerialNo: number | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UnreadDividerProvider initialSerialNo={initialSerialNo}>
        {children}
      </UnreadDividerProvider>
    );
  };
}

function renderUnreadDividerHook() {
  return renderHook(useUnreadDivider);
}

describe("UnreadDividerContext", () => {
  describe("useUnreadDivider", () => {
    it("throws when used outside provider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(renderUnreadDividerHook).toThrow(
        "useUnreadDivider must be used within an UnreadDividerProvider"
      );

      consoleError.mockRestore();
    });

    it("returns initial serial number", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(42),
      });

      expect(result.current.unreadDividerSerialNo).toBe(42);
    });

    it("returns null when initialSerialNo is null", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.unreadDividerSerialNo).toBeNull();
    });

    it("updates serial number when setUnreadDividerSerialNo is called", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(null),
      });

      act(() => {
        result.current.setUnreadDividerSerialNo(99);
      });

      expect(result.current.unreadDividerSerialNo).toBe(99);
    });

    it("clears serial number when set to null", () => {
      const { result } = renderHook(() => useUnreadDivider(), {
        wrapper: createWrapper(42),
      });

      act(() => {
        result.current.setUnreadDividerSerialNo(null);
      });

      expect(result.current.unreadDividerSerialNo).toBeNull();
    });
  });

  describe("useUnreadDividerOptional", () => {
    it("returns null when used outside provider", () => {
      const { result } = renderHook(() => useUnreadDividerOptional());
      expect(result.current).toBeNull();
    });

    it("returns context when used inside provider", () => {
      const { result } = renderHook(() => useUnreadDividerOptional(), {
        wrapper: createWrapper(42),
      });

      expect(result.current?.unreadDividerSerialNo).toBe(42);
    });
  });
});
