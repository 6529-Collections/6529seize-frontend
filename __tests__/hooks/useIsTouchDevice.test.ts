import { renderHook } from "@testing-library/react";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useInteractionMode from "@/src/interaction/useInteractionMode";
import type { InteractionMode } from "@/src/interaction/useInteractionMode";

jest.mock("@/src/interaction/useInteractionMode");

const useInteractionModeMock = useInteractionMode as jest.Mock;

const DEFAULT_INTERACTION_MODE: InteractionMode = {
  canHover: false,
  hasFinePointer: false,
  hasCoarsePointer: false,
  hoverNone: false,
  lastPointerType: null,
  enableHoverUI: false,
  enableLongPress: false,
};

function setInteractionMode(overrides: Partial<InteractionMode> = {}) {
  useInteractionModeMock.mockReturnValue({
    ...DEFAULT_INTERACTION_MODE,
    ...overrides,
  });
}

describe("useIsTouchDevice", () => {
  beforeEach(() => {
    setInteractionMode();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns false when touch activation is disabled", () => {
    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });

  it("returns true when touch activation is enabled", () => {
    setInteractionMode({
      enableLongPress: true,
      hasCoarsePointer: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);
  });
});
