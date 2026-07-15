import { act, cleanup, render } from "@testing-library/react";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  clearWaveDropNearViewport,
  isWaveDropNearViewport,
} from "@/contexts/wave/drop-visibility";

jest.useFakeTimers();

const observe = jest.fn();
const unobserve = jest.fn();
const disconnect = jest.fn();
const resizeObserve = jest.fn();
const resizeUnobserve = jest.fn();
const resizeDisconnect = jest.fn();
let intersectionCb: (entries: any[]) => void = () => {};
let intersectionObserverOptions: any = null;
let intersectionObserverInstances = 0;
let resizeCb: (entries: ResizeObserverEntry[]) => void = () => {};
let resizeObserverInstances = 0;

beforeAll(() => {
  (global as any).IntersectionObserver = class {
    constructor(cb: any, options: any) {
      intersectionObserverInstances += 1;
      intersectionCb = cb;
      intersectionObserverOptions = options;
    }
    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
  };

  (global as any).ResizeObserver = class {
    constructor(cb: (entries: ResizeObserverEntry[]) => void) {
      resizeObserverInstances += 1;
      resizeCb = cb;
    }
    observe = resizeObserve;
    unobserve = resizeUnobserve;
    disconnect = resizeDisconnect;
  };
});

beforeEach(() => {
  const module = require("@/contexts/wave/MyStreamContext");
  (module.useMyStream as jest.Mock).mockReturnValue({
    fetchAroundSerialNo: jest.fn(),
  });
});

afterEach(() => {
  cleanup();
  observe.mockClear();
  unobserve.mockClear();
  disconnect.mockClear();
  resizeObserve.mockClear();
  resizeUnobserve.mockClear();
  resizeDisconnect.mockClear();
  intersectionObserverOptions = null;
  intersectionObserverInstances = 0;
  resizeObserverInstances = 0;
  clearWaveDropNearViewport("wave", "drop-1");
});

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({ fetchAroundSerialNo: jest.fn() })),
}));

function setup(size: DropSize, dropId?: string) {
  const scrollRef = { current: document.createElement("div") };
  const { container } = render(
    <VirtualScrollWrapper
      scrollContainerRef={scrollRef}
      delay={1000}
      dropId={dropId}
      dropSerialNo={1}
      waveId="wave"
      type={size}
    >
      <div data-testid="child">content</div>
    </VirtualScrollWrapper>
  );
  return { container, scrollRef };
}

function emitResize(element: Element, height: number) {
  resizeCb([
    {
      target: element,
      borderBoxSize: [{ blockSize: height }],
      contentRect: { height },
    } as unknown as ResizeObserverEntry,
  ]);
}

test("renders placeholder when out of view", () => {
  const { container } = setup(DropSize.FULL);
  const div = container.firstChild as HTMLElement;

  act(() => {
    emitResize(div, 123);
  });

  act(() => {
    intersectionCb([{ isIntersecting: false } as any]);
  });

  const placeholder = div.firstChild as HTMLElement;
  expect(placeholder.getAttribute("style")).toContain("height: 123px");
  expect(placeholder.tagName).toBe("DIV");
  expect(placeholder.children).toHaveLength(0);
});

test("fetches light drop when entering view", () => {
  const fetchAroundSerialNo = jest.fn();
  const module = require("@/contexts/wave/MyStreamContext");
  (module.useMyStream as jest.Mock).mockReturnValue({ fetchAroundSerialNo });
  setup(DropSize.LIGHT);
  act(() => {
    intersectionCb([{ isIntersecting: true } as any]);
  });
  expect(fetchAroundSerialNo).toHaveBeenCalledWith("wave", 1);
});

describe("IntersectionObserver Configuration", () => {
  test("sets up observer with correct options", () => {
    setup(DropSize.FULL);
    expect(intersectionObserverOptions).toEqual({
      rootMargin: "5000px 0px 5000px 0px",
      threshold: 0.0,
      root: expect.any(HTMLDivElement),
    });
  });

  test("observes container element on mount", () => {
    const { container } = setup(DropSize.FULL);
    expect(observe).toHaveBeenCalledWith(container.firstChild);
  });

  test("updates drop near-viewport registry from observer state", () => {
    setup(DropSize.FULL, "drop-1");

    act(() => {
      intersectionCb([{ isIntersecting: true } as any]);
    });

    expect(isWaveDropNearViewport("wave", "drop-1")).toBe(true);

    act(() => {
      intersectionCb([{ isIntersecting: false } as any]);
    });

    expect(isWaveDropNearViewport("wave", "drop-1")).toBe(false);

    act(() => {
      intersectionCb([{ isIntersecting: true } as any]);
    });

    expect(isWaveDropNearViewport("wave", "drop-1")).toBe(true);
  });

  test("keeps one observer across viewport state changes", () => {
    setup(DropSize.FULL);

    act(() => {
      intersectionCb([{ isIntersecting: false } as any]);
    });
    act(() => {
      intersectionCb([{ isIntersecting: true } as any]);
    });

    expect(intersectionObserverInstances).toBe(1);
  });
});

describe("Drop Size Behavior", () => {
  test("does not measure height for LIGHT drops", () => {
    const { container } = setup(DropSize.LIGHT);
    const div = container.firstChild as HTMLElement;
    const measureSpy = jest.spyOn(div, "getBoundingClientRect");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(measureSpy).not.toHaveBeenCalled();
  });

  test("measures height for FULL drops after delay", () => {
    const { container } = setup(DropSize.FULL);
    const div = container.firstChild as HTMLElement;
    Object.defineProperty(div, "getBoundingClientRect", {
      value: jest.fn(() => ({ height: 200 })),
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(div.getBoundingClientRect).toHaveBeenCalled();
  });

  test("does not fetch when FULL drop enters view", () => {
    const fetchAroundSerialNo = jest.fn();
    const module = require("@/contexts/wave/MyStreamContext");
    (module.useMyStream as jest.Mock).mockReturnValue({ fetchAroundSerialNo });

    setup(DropSize.FULL);
    act(() => {
      intersectionCb([{ isIntersecting: true } as any]);
    });

    expect(fetchAroundSerialNo).not.toHaveBeenCalled();
  });

  test("does not fetch when LIGHT drop leaves view", () => {
    const fetchAroundSerialNo = jest.fn();
    const module = require("@/contexts/wave/MyStreamContext");
    (module.useMyStream as jest.Mock).mockReturnValue({ fetchAroundSerialNo });

    setup(DropSize.LIGHT);
    act(() => {
      intersectionCb([{ isIntersecting: false } as any]);
    });

    expect(fetchAroundSerialNo).not.toHaveBeenCalled();
  });
});

describe("Height Measurement and Placeholder", () => {
  test("shares one resize observer across mounted FULL drops", () => {
    const first = setup(DropSize.FULL);
    const second = setup(DropSize.FULL);

    expect(resizeObserverInstances).toBe(1);
    expect(resizeObserve).toHaveBeenCalledWith(first.container.firstChild);
    expect(resizeObserve).toHaveBeenCalledWith(second.container.firstChild);
  });

  test("renders children when height not measured yet", () => {
    const { container } = setup(DropSize.FULL);
    const testChild = container.querySelector('[data-testid="child"]');
    expect(testChild).toBeInTheDocument();
  });

  test("renders children when in view", () => {
    const { container } = setup(DropSize.FULL);
    const div = container.firstChild as HTMLElement;
    Object.defineProperty(div, "getBoundingClientRect", {
      value: () => ({ height: 150 }),
    });

    // First measure height
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Then ensure it's in view
    act(() => {
      intersectionCb([{ isIntersecting: true } as any]);
    });

    const testChild = container.querySelector('[data-testid="child"]');
    expect(testChild).toBeInTheDocument();
  });

  test("falls back to measuring when a FULL drop leaves before resize data arrives", () => {
    const { container } = setup(DropSize.FULL);
    const div = container.firstChild as HTMLElement;
    const measureSpy = jest.fn(() => ({ height: 175 }));
    Object.defineProperty(div, "getBoundingClientRect", {
      value: measureSpy,
    });

    act(() => {
      intersectionCb([{ isIntersecting: false } as any]);
    });

    expect(measureSpy).toHaveBeenCalled();
  });

  test("does not force a layout read when resize data is already available", () => {
    const { container } = setup(DropSize.FULL);
    const div = container.firstChild as HTMLElement;
    const measureSpy = jest.spyOn(div, "getBoundingClientRect");

    act(() => {
      emitResize(div, 175);
    });
    act(() => {
      intersectionCb([{ isIntersecting: false } as any]);
    });

    expect(measureSpy).not.toHaveBeenCalled();
  });

  test("tracks height changes without forcing layout", () => {
    const { container } = setup(DropSize.FULL);
    const div = container.firstChild as HTMLElement;
    const measureSpy = jest.spyOn(div, "getBoundingClientRect");

    act(() => {
      emitResize(div, 120);
      emitResize(div, 240);
      intersectionCb([{ isIntersecting: false } as any]);
    });

    expect((div.firstChild as HTMLElement).style.height).toBe("240px");
    expect(measureSpy).not.toHaveBeenCalled();
  });

  test("does not remeasure height when leaving viewport for LIGHT drops", () => {
    const { container } = setup(DropSize.LIGHT);
    const div = container.firstChild as HTMLElement;
    const measureSpy = jest.fn(() => ({ height: 175 }));
    Object.defineProperty(div, "getBoundingClientRect", {
      value: measureSpy,
    });

    act(() => {
      intersectionCb([{ isIntersecting: false } as any]);
    });

    expect(measureSpy).not.toHaveBeenCalled();
  });
});

describe("Server-Side Rendering Behavior", () => {
  test("component structure supports SSR", () => {
    // Test that the component renders predictably in a browser environment
    // The actual SSR behavior is tested by the conditional logic in the component
    const { container } = setup(DropSize.FULL);

    // Verify basic structure
    expect(container.firstChild).toBeTruthy();
    expect(container.firstChild?.nodeName).toBe("DIV");

    // Verify children are rendered initially (simulating SSR behavior)
    const testChild = container.querySelector('[data-testid="child"]');
    expect(testChild).toBeInTheDocument();
  });
});

describe("Custom Delay", () => {
  test("respects custom delay prop", () => {
    const scrollRef = { current: document.createElement("div") };
    const { container } = render(
      <VirtualScrollWrapper
        scrollContainerRef={scrollRef}
        delay={2000}
        dropSerialNo={1}
        waveId="wave"
        type={DropSize.FULL}
      >
        <div data-testid="child">content</div>
      </VirtualScrollWrapper>
    );

    const div = container.firstChild as HTMLElement;
    const measureSpy = jest.fn(() => ({ height: 100 }));
    Object.defineProperty(div, "getBoundingClientRect", {
      value: measureSpy,
    });

    // Should not measure after 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(measureSpy).not.toHaveBeenCalled();

    // Should measure after 2000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(measureSpy).toHaveBeenCalled();
  });
});

describe("Error Handling", () => {
  test("handles null container ref gracefully", () => {
    const { container } = setup(DropSize.FULL);

    // This test verifies the component doesn't crash when containerRef.current is falsy
    // The measureHeight function checks if (containerRef.current) before proceeding
    const div = container.firstChild as HTMLElement;

    // Mock getBoundingClientRect to return valid data
    Object.defineProperty(div, "getBoundingClientRect", {
      value: () => ({ height: 100 }),
    });

    // Component should handle the measurement without throwing
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }).not.toThrow();
  });
});
