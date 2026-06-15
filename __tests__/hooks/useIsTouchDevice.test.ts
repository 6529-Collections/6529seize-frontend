import { renderHook } from "@testing-library/react";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useInteractionMode from "@/src/interaction/useInteractionMode";
import { createInteractionMode } from "@/__tests__/utils/interactionMode";

jest.mock("@/src/interaction/useInteractionMode");

const useInteractionModeMock = useInteractionMode as jest.Mock;

function setInteractionMode(
  overrides: Parameters<typeof createInteractionMode>[0] = {}
) {
  useInteractionModeMock.mockReturnValue(createInteractionMode(overrides));
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
