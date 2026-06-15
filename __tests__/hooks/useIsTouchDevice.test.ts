import { renderHook } from "@testing-library/react";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useInteractionMode from "@/src/interaction/useInteractionMode";

jest.mock("@/src/interaction/useInteractionMode");

const useInteractionModeMock = useInteractionMode as jest.Mock;

describe("useIsTouchDevice", () => {
  beforeEach(() => {
    useInteractionModeMock.mockReturnValue({ enableLongPress: false });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns false when touch activation is disabled", () => {
    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });

  it("returns true when touch activation is enabled", () => {
    useInteractionModeMock.mockReturnValue({ enableLongPress: true });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);
  });
});
