import { render } from "@testing-library/react";
import { useRef } from "react";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";

const mockHasTouchScreen = { value: true };
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isMobileDevice: true,
    hasTouchScreen: mockHasTouchScreen.value,
    isApp: false,
    isAppleMobile: true,
  }),
}));

function Harness() {
  const ref = useRef<HTMLDivElement | null>(null);
  useKeyboardFocusScroll(ref);
  return (
    <div ref={ref}>
      <input aria-label="field" />
    </div>
  );
}

describe("useKeyboardFocusScroll", () => {
  let scrollIntoView: jest.Mock;
  const realVV = window.visualViewport;

  beforeEach(() => {
    jest.useFakeTimers();
    mockHasTouchScreen.value = true;
    scrollIntoView = jest.fn();
    // jsdom lacks scrollIntoView.
    Element.prototype.scrollIntoView = scrollIntoView;
    // Give jsdom a minimal visualViewport with an event target.
    const listeners = new Set<() => void>();
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        height: 800,
        offsetTop: 0,
        addEventListener: (_: string, cb: () => void) => listeners.add(cb),
        removeEventListener: (_: string, cb: () => void) =>
          listeners.delete(cb),
        dispatchResize: () => listeners.forEach((cb) => cb()),
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: realVV,
    });
  });

  it("scrolls the focused field into view after the keyboard settle delay", () => {
    const { getByLabelText } = render(<Harness />);
    const input = getByLabelText("field") as HTMLInputElement;

    input.focus();
    expect(scrollIntoView).not.toHaveBeenCalled(); // waits for the settle delay
    jest.advanceTimersByTime(400);
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "center" })
    );
  });

  it("re-scrolls when the visual viewport resizes (late keyboard)", () => {
    const { getByLabelText } = render(<Harness />);
    const input = getByLabelText("field") as HTMLInputElement;

    input.focus();
    jest.advanceTimersByTime(400);
    scrollIntoView.mockClear();

    // The keyboard finishing its animation fires a visualViewport resize.
    (
      window.visualViewport as unknown as { dispatchResize: () => void }
    ).dispatchResize();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("does nothing on non-touch devices", () => {
    mockHasTouchScreen.value = false;
    const { getByLabelText } = render(<Harness />);
    (getByLabelText("field") as HTMLInputElement).focus();
    jest.advanceTimersByTime(400);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
