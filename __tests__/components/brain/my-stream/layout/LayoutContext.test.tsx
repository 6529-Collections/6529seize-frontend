import React, { useEffect, useRef } from "react";
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
        {spaces.contentSpace}
      </div>
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
  const { contentContainerStyle, waveViewStyle } = useLayout();

  return (
    <>
      <div data-testid="content-container" style={contentContainerStyle} />
      <div data-testid="wave-view" style={waveViewStyle} />
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
    expect(content.textContent).toBe("900");
    expect(content.style.height).toContain("100px");
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
      "height var(--native-keyboard-layout-transition-duration, 0ms) ease-out, max-height var(--native-keyboard-layout-transition-duration, 0ms) ease-out"
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
      isVisible: true,
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
