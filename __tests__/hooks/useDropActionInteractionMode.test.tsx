import { renderHook } from "@testing-library/react";
import React from "react";
import { renderToString } from "react-dom/server";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";

jest.mock("@/hooks/isMobileDevice");
jest.mock("@/hooks/useHasTouchInput", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const isMobileMock = useIsMobileDevice as jest.Mock;
const hasTouchInputMock = useHasTouchInput as jest.Mock;
const isTouchDeviceMock = useIsTouchDevice as jest.Mock;

const HOVER_INPUT_MEDIA_QUERIES = new Set([
  "(any-hover: hover)",
  "(hover: hover)",
]);

/** Sets the jsdom viewport width and notifies resize subscribers. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  globalThis.window.dispatchEvent(new Event("resize"));
};

/** Mocks hover media queries used by drop action interaction mode. */
const setHoverSupport = (hasHover: boolean) => {
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn((query: string) => ({
      matches: hasHover && HOVER_INPUT_MEDIA_QUERIES.has(query),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("useDropActionInteractionMode", () => {
  beforeEach(() => {
    isMobileMock.mockReturnValue(false);
    hasTouchInputMock.mockReturnValue(false);
    isTouchDeviceMock.mockReturnValue(false);
    setViewportWidth(1440);
    setHoverSupport(true);
  });

  it("allows the touch sheet on phone-width touch devices", () => {
    isMobileMock.mockReturnValue(true);
    setViewportWidth(390);
    setHoverSupport(false);

    const { result } = renderHook(() => useDropActionInteractionMode());

    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: false,
        canUseTouchActionSheet: true,
      })
    );
  });

  it("keeps desktop actions on desktop-width hybrid touch devices with hover", () => {
    hasTouchInputMock.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(true);

    const { result } = renderHook(() => useDropActionInteractionMode());

    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: true,
        canUseTouchActionSheet: false,
      })
    );
  });

  it("uses the touch sheet instead of desktop actions on compact touch devices with hover", () => {
    hasTouchInputMock.mockReturnValue(true);
    setViewportWidth(800);
    setHoverSupport(true);

    const { result } = renderHook(() => useDropActionInteractionMode());

    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: false,
        canUseTouchActionSheet: true,
      })
    );
  });

  it("allows the touch sheet on desktop-width touch devices without hover", () => {
    hasTouchInputMock.mockReturnValue(true);
    isTouchDeviceMock.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(false);

    const { result } = renderHook(() => useDropActionInteractionMode());

    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: false,
        canUseTouchActionSheet: true,
      })
    );
  });

  it("keeps desktop actions on desktop-width mobile user agents with hover", () => {
    isMobileMock.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(true);

    const { result } = renderHook(() => useDropActionInteractionMode());

    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: true,
        canUseTouchActionSheet: false,
      })
    );
  });

  it("keeps desktop actions for desktop mouse input", () => {
    setViewportWidth(1440);
    setHoverSupport(true);

    const { result } = renderHook(() => useDropActionInteractionMode());

    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: true,
        canUseTouchActionSheet: false,
      })
    );
  });

  it("uses a server-stable hover snapshot before client updates", () => {
    isMobileMock.mockReturnValue(true);
    setViewportWidth(1440);
    setHoverSupport(true);

    const ModeProbe = () => {
      const mode = useDropActionInteractionMode();
      return (
        <span
          data-mode={`${String(mode.canUseDesktopHoverActions)}:${String(
            mode.canUseTouchActionSheet
          )}`}
        />
      );
    };

    expect(renderToString(<ModeProbe />)).toContain('data-mode="false:true"');

    const { result } = renderHook(() => useDropActionInteractionMode());
    expect(result.current).toEqual(
      expect.objectContaining({
        canUseDesktopHoverActions: true,
        canUseTouchActionSheet: false,
      })
    );
  });
});
