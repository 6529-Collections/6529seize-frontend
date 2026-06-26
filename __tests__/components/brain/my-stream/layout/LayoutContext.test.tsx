import React, { useEffect, useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  LayoutProvider,
  useLayout,
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
let mockKeyboardValues = { isVisible: false, keyboardHeight: 0 };
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
  mockKeyboardValues = { isVisible: false, keyboardHeight: 0 };
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

describe("LayoutProvider", () => {
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
    mockKeyboardValues = { isVisible: false, keyboardHeight: 0 };

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
    mockKeyboardValues = { isVisible: true, keyboardHeight: 350 };

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
    mockKeyboardValues = { isVisible: false, keyboardHeight: 0 };

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
    mockKeyboardValues = { isVisible: false, keyboardHeight: 0 };

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
});
