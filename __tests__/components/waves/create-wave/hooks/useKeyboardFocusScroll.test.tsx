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

function Harness({
  mode = "center",
}: {
  readonly mode?: "center" | "nearest";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useKeyboardFocusScroll(ref, mode);
  return (
    <div ref={ref} data-testid="scrollport">
      <div data-keyboard-scroll-target="" data-testid="results-target">
        <input aria-label="field" />
      </div>
      <input aria-label="other field" />
    </div>
  );
}

describe("useKeyboardFocusScroll", () => {
  let scrollIntoView: jest.Mock;
  const realVV = window.visualViewport;
  let resizeCallback: ResizeObserverCallback;
  let observer: {
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockHasTouchScreen.value = true;
    observer = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
    jest.spyOn(globalThis, "ResizeObserver").mockImplementation((callback) => {
      resizeCallback = callback;
      return observer;
    });
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
    jest.restoreAllMocks();
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

  it("centers again after the last resize settles and cancels on unmount", () => {
    const { getByLabelText, unmount } = render(<Harness />);
    (getByLabelText("field") as HTMLInputElement).focus();
    jest.advanceTimersByTime(400);
    scrollIntoView.mockClear();
    const viewport = window.visualViewport as unknown as {
      dispatchResize: () => void;
    };

    viewport.dispatchResize();
    jest.advanceTimersByTime(250);
    viewport.dispatchResize();
    jest.advanceTimersByTime(349);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1);
    expect(scrollIntoView).toHaveBeenCalledTimes(3);

    viewport.dispatchResize();
    unmount();
    scrollIntoView.mockClear();
    jest.advanceTimersByTime(400);
    viewport.dispatchResize();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  const setupNearest = (fieldTop = 480, targetBottom = 580) => {
    const view = render(<Harness mode="nearest" />);
    const input = view.getByLabelText("field");
    const container = view.getByTestId("scrollport");
    const target = view.getByTestId("results-target");
    const scrollBy = jest.fn();
    container.scrollBy = scrollBy;
    jest
      .spyOn(container, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, 0, 400, 600));
    jest
      .spyOn(input, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, fieldTop, 300, 40));
    jest
      .spyOn(target, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, fieldTop, 300, targetBottom - fieldTop));
    return { ...view, input, container, target, scrollBy };
  };

  it("coalesces keyboard animation frames into one editor correction", () => {
    const { input, scrollBy } = setupNearest();
    input.focus();
    for (let frame = 0; frame < 12; frame++) {
      Object.defineProperty(window.visualViewport, "height", {
        configurable: true,
        value: 300,
      });
      (
        window.visualViewport as unknown as { dispatchResize: () => void }
      ).dispatchResize();
      jest.advanceTimersByTime(25);
    }
    expect(scrollBy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(350);
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: 292, behavior: "instant" });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("leaves an already visible field and results in place", () => {
    const { input, scrollBy } = setupNearest(100, 200);
    input.focus();
    jest.advanceTimersByTime(400);
    expect(scrollBy).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("corrects a field clipped above the editor without smooth scrolling", () => {
    const { input, scrollBy } = setupNearest(-20, 20);
    input.focus();
    jest.advanceTimersByTime(400);
    expect(scrollBy).toHaveBeenCalledWith({ top: -32, behavior: "instant" });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("rechecks asynchronous results and releases observation on blur", () => {
    const { input, target, scrollBy, unmount } = setupNearest(480, 580);
    input.focus();
    expect(observer.observe).toHaveBeenCalledWith(target);
    jest.advanceTimersByTime(400);
    scrollBy.mockClear();
    resizeCallback([], observer);
    jest.advanceTimersByTime(200);
    input.blur();
    expect(observer.unobserve).toHaveBeenCalledWith(target);
    jest.advanceTimersByTime(400);
    expect(scrollBy).not.toHaveBeenCalled();
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
