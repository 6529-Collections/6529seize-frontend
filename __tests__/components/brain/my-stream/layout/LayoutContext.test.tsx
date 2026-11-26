import PhoneListLayoutProvider from "@/components/mobile-navigation/PhoneListLayoutProvider";
import React, { StrictMode, useCallback, useEffect, useRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import {
  LayoutProvider,
  useLayout,
  useLayoutViewportLock,
} from "@/components/brain/my-stream/layout/LayoutContext";

// Mock useCapacitor hook with configurable values
let mockCapacitorValues: {
  isCapacitor: boolean;
  isAndroid: boolean;
  isIos?: boolean;
} = { isCapacitor: false, isAndroid: false };
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => mockCapacitorValues,
}));

// Mock useNativeKeyboard hook with configurable values
type MockKeyboardPhase = "hidden" | "showing" | "visible" | "hiding";

let mockKeyboardValues: {
  isVisible: boolean;
  keyboardHeight: number;
  phase: MockKeyboardPhase;
} = { isVisible: false, keyboardHeight: 0, phase: "hidden" };
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: () => mockKeyboardValues,
}));

beforeAll(() => {
  // run RAF callbacks immediately
  global.requestAnimationFrame = (cb: any) => {
    cb();
    return 0;
  };
  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

afterAll(() => {
  delete (global as any).requestAnimationFrame;
});

beforeEach(() => {
  // Reset mocks before each test
  mockCapacitorValues = { isCapacitor: false, isAndroid: false };
  mockKeyboardValues = {
    isVisible: false,
    keyboardHeight: 0,
    phase: "hidden",
  };
});

function TestComponent() {
  const { registerRef, spaces, waveViewStyle } = useLayout();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      // mock height
      (ref.current as any).getBoundingClientRect = () => ({ height: 100 });
      registerRef("header", ref.current);
    }
  }, [registerRef]);
  return (
    <>
      <div ref={ref} />
      <div data-testid="content" style={waveViewStyle}>
        {spaces.headerSpace}
      </div>
    </>
  );
}

function ScopedHeaderProbe({
  name,
  height,
}: {
  readonly name: string;
  readonly height: number;
}) {
  const { registerRef, spaces } = useLayout();
  const setHeader = useCallback(
    (node: HTMLDivElement | null) => {
      if (node)
        node.getBoundingClientRect = () => new DOMRect(0, 0, 400, height);
      registerRef("header", node);
    },
    [height, registerRef]
  );
  return (
    <>
      <div ref={setHeader} />
      <output data-testid={name}>{spaces.headerSpace}</output>
    </>
  );
}

it("isolates retained header measurements and keeps a fallback during loading", () => {
  const view = (height: number, active: boolean) => (
    <LayoutProvider>
      <ScopedHeaderProbe name="outer-header" height={100} />
      <PhoneListLayoutProvider active={active}>
        <ScopedHeaderProbe name="retained-header" height={height} />
      </PhoneListLayoutProvider>
    </LayoutProvider>
  );
  const { rerender } = render(view(0, false));
  expect(screen.getByTestId("outer-header")).toHaveTextContent("100");
  expect(screen.getByTestId("retained-header")).toHaveTextContent("64");
  rerender(view(70, true));
  expect(screen.getByTestId("outer-header")).toHaveTextContent("100");
  expect(screen.getByTestId("retained-header")).toHaveTextContent("70");
  rerender(view(0, false));
  expect(screen.getByTestId("outer-header")).toHaveTextContent("100");
  expect(screen.getByTestId("retained-header")).toHaveTextContent("70");
});

function NavigationRegistrationProbe({
  visible,
}: {
  readonly visible: boolean;
}) {
  const { registerRef, spaces } = useLayout();
  const setNavRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        node.getBoundingClientRect = () => ({ height: 80 }) as DOMRect;
      }
      registerRef("mobileNav", node);
    },
    [registerRef]
  );
  return (
    <>
      {visible && <div ref={setNavRef} />}
      <output data-testid="registered-nav-height">
        {spaces.mobileNavSpace}
      </output>
    </>
  );
}

function MobileWavesTestComponent() {
  const { registerRef, mobileWavesViewStyle } = useLayout();
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      (headerRef.current as any).getBoundingClientRect = () => ({
        height: 100,
      });
      registerRef("header", headerRef.current);
    }

    if (navRef.current) {
      (navRef.current as any).getBoundingClientRect = () => ({
        height: 80,
      });
      registerRef("mobileNav", navRef.current);
    }
  }, [registerRef]);

  return (
    <>
      <div ref={headerRef} />
      <div ref={navRef} />
      <div data-testid="mobile-waves" style={mobileWavesViewStyle} />
    </>
  );
}

function FallbackStyleComponent() {
  const { contentContainerStyle, waveViewStyle, myVotesViewStyle } =
    useLayout();

  return (
    <>
      <div data-testid="content-container" style={contentContainerStyle} />
      <div data-testid="wave-view" style={waveViewStyle} />
      <div data-testid="my-votes-view" style={myVotesViewStyle} />
    </>
  );
}

function NotificationsStyleComponent() {
  const { notificationsViewStyle } = useLayout();

  return (
    <div data-testid="notifications-view" style={notificationsViewStyle} />
  );
}

function ViewportLockTestComponent({ isOpen }: { readonly isOpen: boolean }) {
  useLayoutViewportLock(isOpen);
  const { isViewportLocked } = useLayout();

  return (
    <div data-testid="viewport-lock-state">
      {isViewportLocked ? "locked" : "unlocked"}
    </div>
  );
}

describe("LayoutProvider", () => {
  it.each([true, false])(
    "gives the final vote keyboard clearance only in the app (%s)",
    (isCapacitor) => {
      mockCapacitorValues = { isCapacitor, isAndroid: isCapacitor };
      render(
        <LayoutProvider>
          <FallbackStyleComponent />
        </LayoutProvider>
      );
      const { style } = screen.getByTestId("my-votes-view");
      expect(style.height.includes("--native-keyboard-inset-bottom")).toBe(
        isCapacitor
      );
      expect(style.maxHeight).toBe(style.height);
    }
  );

  it("updates changed registrations before animation frames without warnings in StrictMode", () => {
    const originalRequestAnimationFrame = global.requestAnimationFrame;
    global.requestAnimationFrame = jest.fn(() => 1);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const view = (visible: boolean) => (
      <StrictMode>
        <LayoutProvider>
          <NavigationRegistrationProbe visible={visible} />
        </LayoutProvider>
      </StrictMode>
    );
    try {
      const { rerender, unmount } = render(view(true));
      expect(screen.getByTestId("registered-nav-height")).toHaveTextContent(
        /^80$/u
      );
      for (const visible of [false, true, false, true]) {
        rerender(view(visible));
        expect(screen.getByTestId("registered-nav-height")).toHaveTextContent(
          visible ? /^80$/u : /^0$/u
        );
      }
      unmount();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      global.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });

  it("provides viewport-sized fallback styles before measurement completes", () => {
    const originalRequestAnimationFrame = global.requestAnimationFrame;
    global.requestAnimationFrame = jest.fn(
      (_callback: FrameRequestCallback) => 1
    );

    try {
      render(
        <LayoutProvider>
          <FallbackStyleComponent />
        </LayoutProvider>
      );

      const contentContainer = screen.getByTestId("content-container");
      const waveView = screen.getByTestId("wave-view");

      expect(contentContainer.style.display).toBe("flex");
      expect(contentContainer.style.height).toContain(
        "var(--layout-viewport-height)"
      );
      expect(waveView.style.height).toContain("var(--layout-viewport-height)");
      expect(waveView.style.maxHeight).toContain(
        "var(--layout-viewport-height)"
      );
    } finally {
      global.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });

  it("calculates spaces and styles", () => {
    Object.defineProperty(globalThis, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("100");
    expect(content.style.height).toContain("100px");
  });

  it("does not re-render consumers when a window resize leaves measurements unchanged", () => {
    let renders = 0;
    function RenderCounter() {
      useLayout();
      renders += 1;
      return null;
    }
    render(
      <LayoutProvider>
        <TestComponent />
        <RenderCounter />
      </LayoutProvider>
    );
    const rendersAfterMeasurement = renders;

    // A mobile URL bar collapsing during scroll changes only innerHeight.
    act(() => {
      Object.defineProperty(globalThis, "innerHeight", {
        value: 700,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("resize"));
    });

    expect(renders).toBe(rendersAfterMeasurement);
    expect(screen.getByTestId("content").textContent).toBe("100");
  });

  it("re-measures after a window resize changes a registered element", () => {
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const header = screen.getByTestId("content").previousElementSibling;
    expect(header).not.toBeNull();

    act(() => {
      (header as any).getBoundingClientRect = () => ({ height: 64 });
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("content").textContent).toBe("64");
  });

  it("does not apply fallback capSpace on Android when keyboard is closed", () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: true };
    mockKeyboardValues = {
      isVisible: false,
      keyboardHeight: 0,
      phase: "hidden",
    };

    Object.defineProperty(globalThis, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId("content");
    expect(content.style.height).not.toContain("- 128px");
    expect(content.style.height).not.toContain("128px");
  });

  it("does not apply fallback capSpace on Android when keyboard is open", () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: true };
    mockKeyboardValues = {
      isVisible: true,
      keyboardHeight: 350,
      phase: "visible",
    };

    Object.defineProperty(globalThis, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId("content");
    expect(content.style.height).not.toContain("- 128px");
    expect(content.style.height).not.toContain("128px");
  });

  it("does not apply capSpace on iOS", () => {
    mockCapacitorValues = {
      isCapacitor: true,
      isAndroid: false,
      isIos: true,
    };
    mockKeyboardValues = {
      isVisible: false,
      keyboardHeight: 0,
      phase: "hidden",
    };

    Object.defineProperty(globalThis, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId("content");
    expect(content.style.height).not.toContain("- 20px");
    expect(content.style.height).not.toContain("- 128px");
  });

  it("does not apply capSpace on desktop", () => {
    mockCapacitorValues = { isCapacitor: false, isAndroid: false };
    mockKeyboardValues = {
      isVisible: false,
      keyboardHeight: 0,
      phase: "hidden",
    };

    Object.defineProperty(globalThis, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId("content");
    // Should not include any capSpace
    expect(content.style.height).not.toContain("- 128px");
    expect(content.style.height).not.toContain("- 20px");
  });

  it("does not subtract the floating mobile nav from mobile waves list height", async () => {
    Object.defineProperty(globalThis, "innerHeight", {
      value: 1000,
      configurable: true,
    });

    render(
      <LayoutProvider>
        <MobileWavesTestComponent />
      </LayoutProvider>
    );

    const content = screen.getByTestId("mobile-waves");

    await waitFor(() => {
      expect(content.style.maxHeight).toContain("- 100px");
    });
    expect(content.style.maxHeight).not.toContain("- 80px");
  });

  it.each([true, false])(
    "makes the Waves list follow the keyboard only in the native app (%s)",
    (isCapacitor) => {
      mockCapacitorValues = {
        isCapacitor,
        isAndroid: false,
        isIos: isCapacitor,
      };
      render(
        <LayoutProvider>
          <MobileWavesTestComponent />
        </LayoutProvider>
      );
      const { style } = screen.getByTestId("mobile-waves");
      expect(style.height.includes("--native-keyboard-inset-bottom")).toBe(
        isCapacitor
      );
      expect(style.maxHeight).toBe(style.height);
      expect(
        style.transition.includes(
          "--native-keyboard-layout-transition-duration"
        )
      ).toBe(isCapacitor);
      expect(style.height).not.toContain("- 80px");
    }
  );

  it("subtracts the shared keyboard inset from native notifications", () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: false, isIos: true };

    render(
      <LayoutProvider>
        <NotificationsStyleComponent />
      </LayoutProvider>
    );

    const notifications = screen.getByTestId("notifications-view");

    expect(notifications.style.height).toContain(
      "- var(--native-keyboard-inset-bottom, 0px)"
    );
    expect(notifications.style.maxHeight).toContain(
      "- var(--native-keyboard-inset-bottom, 0px)"
    );
    expect(notifications.style.transition).toBe(
      "height var(--native-keyboard-layout-transition-duration, 0ms) var(--native-keyboard-layout-transition-easing, ease-out), max-height var(--native-keyboard-layout-transition-duration, 0ms) var(--native-keyboard-layout-transition-easing, ease-out)"
    );
  });

  it("keeps responsive web notifications free of native keyboard styles", () => {
    render(
      <LayoutProvider>
        <NotificationsStyleComponent />
      </LayoutProvider>
    );

    const notifications = screen.getByTestId("notifications-view");

    expect(notifications.style.height).not.toContain(
      "--native-keyboard-inset-bottom"
    );
    expect(notifications.style.maxHeight).not.toContain(
      "--native-keyboard-inset-bottom"
    );
    expect(notifications.style.transition).toBe("");
  });

  it("keeps the viewport locked until the native keyboard is fully hidden", () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: false, isIos: true };
    mockKeyboardValues = {
      isVisible: true,
      keyboardHeight: 320,
      phase: "visible",
    };

    const { rerender } = render(
      <LayoutProvider>
        <ViewportLockTestComponent isOpen />
      </LayoutProvider>
    );

    expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
      "locked"
    );

    rerender(
      <LayoutProvider>
        <ViewportLockTestComponent isOpen={false} />
      </LayoutProvider>
    );

    expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
      "locked"
    );

    mockKeyboardValues = {
      isVisible: false,
      keyboardHeight: 0,
      phase: "hiding",
    };
    rerender(
      <LayoutProvider>
        <ViewportLockTestComponent isOpen={false} />
      </LayoutProvider>
    );

    expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
      "locked"
    );

    mockKeyboardValues = {
      isVisible: false,
      keyboardHeight: 0,
      phase: "hidden",
    };
    rerender(
      <LayoutProvider>
        <ViewportLockTestComponent isOpen={false} />
      </LayoutProvider>
    );

    expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
      "unlocked"
    );
  });

  it.each([
    { phase: "hiding", reopen: false, reason: "a missing did-hide event" },
    { phase: "hidden", reopen: false, reason: "an early did-hide event" },
    { phase: "hiding", reopen: true, reason: "a rapid reopen during hiding" },
  ] as const)(
    "restores Android layout safely after $reason",
    ({ phase, reopen }) => {
      jest.useFakeTimers();
      mockCapacitorValues = {
        isCapacitor: true,
        isAndroid: true,
        isIos: false,
      };
      const originalHeight = Object.getOwnPropertyDescriptor(
        globalThis,
        "innerHeight"
      );
      const originalViewport = Object.getOwnPropertyDescriptor(
        globalThis,
        "visualViewport"
      );
      let height = 800;
      const viewport = new EventTarget();
      Object.defineProperty(viewport, "height", { get: () => height });
      Object.defineProperties(globalThis, {
        innerHeight: { configurable: true, get: () => height },
        visualViewport: { configurable: true, value: viewport },
      });
      const view = (isOpen: boolean) => (
        <LayoutProvider>
          <ViewportLockTestComponent isOpen={isOpen} />
        </LayoutProvider>
      );
      const { rerender, unmount } = render(view(true));

      try {
        height = 480;
        mockKeyboardValues = {
          isVisible: true,
          keyboardHeight: 320,
          phase: "visible",
        };
        rerender(view(true));
        rerender(view(false));
        expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
          "locked"
        );

        mockKeyboardValues = { isVisible: false, keyboardHeight: 0, phase };
        rerender(view(false));
        expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
          "locked"
        );

        if (reopen) rerender(view(true));
        act(() => {
          height = 800;
          viewport.dispatchEvent(new Event("resize"));
        });
        if (reopen) {
          act(() => jest.advanceTimersByTime(1250));
          expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
            "locked"
          );
          rerender(view(false));
        }

        expect(screen.getByTestId("viewport-lock-state")).toHaveTextContent(
          "unlocked"
        );
        expect(document.documentElement).not.toHaveAttribute(
          "data-layout-viewport-locked"
        );
        expect(mockKeyboardValues.phase).toBe(phase);
      } finally {
        unmount();
        if (originalHeight)
          Object.defineProperty(globalThis, "innerHeight", originalHeight);
        else Reflect.deleteProperty(globalThis, "innerHeight");
        if (originalViewport)
          Object.defineProperty(globalThis, "visualViewport", originalViewport);
        else Reflect.deleteProperty(globalThis, "visualViewport");
        jest.useRealTimers();
      }
    }
  );

  it("refreshes the locked viewport height after device rotation", () => {
    const originalInnerHeight = globalThis.innerHeight;
    const originalInnerWidth = globalThis.innerWidth;
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      value: 400,
    });

    try {
      render(
        <LayoutProvider>
          <ViewportLockTestComponent isOpen />
        </LayoutProvider>
      );

      expect(
        document.documentElement.style.getPropertyValue(
          "--layout-viewport-height"
        )
      ).toBe("800px");

      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: 400,
      });
      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: 800,
      });
      act(() => window.dispatchEvent(new Event("orientationchange")));

      expect(
        document.documentElement.style.getPropertyValue(
          "--layout-viewport-height"
        )
      ).toBe("400px");
    } finally {
      Object.defineProperty(globalThis, "innerHeight", {
        configurable: true,
        value: originalInnerHeight,
      });
      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: originalInnerWidth,
      });
    }
  });
});
