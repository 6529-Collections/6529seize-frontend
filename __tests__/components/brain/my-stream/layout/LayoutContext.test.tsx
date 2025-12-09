import React, { useEffect, useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { LayoutProvider, useLayout } from '@/components/brain/my-stream/layout/LayoutContext';

// Mock useCapacitor hook with configurable values
let mockCapacitorValues = { isCapacitor: false, isAndroid: false, isIos: false };
jest.mock('@/hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => mockCapacitorValues
}));

// Mock useAndroidKeyboard hook with configurable values
let mockKeyboardValues = { isVisible: false, keyboardHeight: 0, isAndroid: false, getContainerStyle: jest.fn() };
jest.mock('@/hooks/useAndroidKeyboard', () => ({
  useAndroidKeyboard: () => mockKeyboardValues
}));

beforeAll(() => {
  // run RAF callbacks immediately
  global.requestAnimationFrame = (cb: any) => { cb(); return 0; };
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
  mockCapacitorValues = { isCapacitor: false, isAndroid: false, isIos: false };
  mockKeyboardValues = { isVisible: false, keyboardHeight: 0, isAndroid: false, getContainerStyle: jest.fn() };
});

function TestComponent() {
  const { registerRef, spaces, waveViewStyle } = useLayout();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      // mock height
      (ref.current as any).getBoundingClientRect = () => ({ height: 100 });
      registerRef('header', ref.current);
    }
  }, [registerRef]);
  return (
    <>
      <div ref={ref} />
      <div data-testid="content" style={waveViewStyle}>{spaces.contentSpace}</div>
    </>
  );
}

describe('LayoutProvider', () => {
  it('calculates spaces and styles', () => {
    Object.defineProperty(globalThis, 'innerHeight', { value: 1000, configurable: true });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId('content');
    expect(content.textContent).toBe('900');
    expect(content.style.height).toContain('calc(100dvh - 100px');
  });

  it('applies 128px capSpace on Android when keyboard is closed', () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: true, isIos: false };
    mockKeyboardValues = { isVisible: false, keyboardHeight: 0, isAndroid: true, getContainerStyle: jest.fn() };

    Object.defineProperty(globalThis, 'innerHeight', { value: 1000, configurable: true });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId('content');
    // Should include 128px capSpace
    expect(content.style.height).toContain('- 128px');
  });

  it('removes capSpace and subtracts keyboard height on Android when keyboard is open', () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: true, isIos: false };
    mockKeyboardValues = { isVisible: true, keyboardHeight: 350, isAndroid: true, getContainerStyle: jest.fn() };

    Object.defineProperty(globalThis, 'innerHeight', { value: 1000, configurable: true });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId('content');
    // Should subtract keyboard height (350px) but not capSpace
    expect(content.style.height).toContain('- 350px');
    expect(content.style.height).not.toContain('- 128px');
  });

  it('applies 20px capSpace on iOS', () => {
    mockCapacitorValues = { isCapacitor: true, isAndroid: false, isIos: true };
    mockKeyboardValues = { isVisible: false, keyboardHeight: 0, isAndroid: false, getContainerStyle: jest.fn() };

    Object.defineProperty(globalThis, 'innerHeight', { value: 1000, configurable: true });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId('content');
    // Should include 20px capSpace for iOS
    expect(content.style.height).toContain('- 20px');
  });

  it('does not apply capSpace on desktop', () => {
    mockCapacitorValues = { isCapacitor: false, isAndroid: false, isIos: false };
    mockKeyboardValues = { isVisible: false, keyboardHeight: 0, isAndroid: false, getContainerStyle: jest.fn() };

    Object.defineProperty(globalThis, 'innerHeight', { value: 1000, configurable: true });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId('content');
    // Should not include any capSpace
    expect(content.style.height).not.toContain('- 128px');
    expect(content.style.height).not.toContain('- 20px');
  });
});
