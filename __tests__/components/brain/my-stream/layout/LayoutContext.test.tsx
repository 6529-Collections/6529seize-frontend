import React, { useEffect, useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { LayoutProvider, useLayout } from '../../../../../components/brain/my-stream/layout/LayoutContext';

jest.mock('../../../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false, isAndroid: false, isIos: false }) }));

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
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>
    );
    const content = screen.getByTestId('content');
    expect(content.textContent).toBe('900');
    expect(content.style.height).toContain('calc(100vh - 100px');
  });
});
