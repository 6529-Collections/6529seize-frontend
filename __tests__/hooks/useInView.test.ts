import { renderHook } from '@testing-library/react';
import { useInView } from '@/hooks/useInView';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
const mockUnobserve = jest.fn();

const mockIntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  unobserve: mockUnobserve,
}));

// @ts-ignore
global.IntersectionObserver = mockIntersectionObserver;

describe('useInView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ref and initial visibility state', () => {
    const { result } = renderHook(() => useInView());
    
    const [ref, isVisible] = result.current;
    
    expect(ref.current).toBeNull();
    expect(isVisible).toBe(false);
  });

  it('does not create observer if ref is null', () => {
    renderHook(() => useInView());
    
    // Should not create observer without an element
    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });

  it('returns correct initial state with custom options', () => {
    const { result } = renderHook(() => useInView({ threshold: 0.5 }));
    
    const [ref, isVisible] = result.current;
    
    expect(ref.current).toBeNull();
    expect(isVisible).toBe(false);
  });

  it('maintains type safety for different element types', () => {
    const { result } = renderHook(() => useInView<HTMLDivElement>());
    
    const [ref, isVisible] = result.current;
    
    expect(ref.current).toBeNull();
    expect(isVisible).toBe(false);
    expect(typeof ref).toBe('object');
  });

  it('provides stable reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useInView());
    
    const [initialRef] = result.current;
    
    rerender();
    
    const [rerenderRef] = result.current;
    
    expect(initialRef).toBe(rerenderRef);
  });

  it('accepts intersection observer options', () => {
    const customOptions = { 
      threshold: 0.5, 
      rootMargin: '100px',
      root: null 
    };
    
    renderHook(() => useInView(customOptions));
    
    // The hook should accept these options without error
    expect(true).toBe(true);
  });

  it('handles undefined options gracefully', () => {
    renderHook(() => useInView(undefined));
    
    // Should work with undefined options
    expect(true).toBe(true);
  });

  it('returns boolean visibility state', () => {
    const { result } = renderHook(() => useInView());
    
    const [, isVisible] = result.current;
    
    expect(typeof isVisible).toBe('boolean');
    expect(isVisible).toBe(false);
  });

  it('provides correct return type structure', () => {
    const { result } = renderHook(() => useInView());
    
    const hookResult = result.current;
    
    expect(Array.isArray(hookResult)).toBe(true);
    expect(hookResult).toHaveLength(2);
    expect(typeof hookResult[0]).toBe('object'); // ref
    expect(typeof hookResult[1]).toBe('boolean'); // isVisible
  });

  it('maintains consistent behavior across multiple instances', () => {
    const { result: result1 } = renderHook(() => useInView());
    const { result: result2 } = renderHook(() => useInView());
    
    expect(result1.current[1]).toBe(result2.current[1]); // Both should start as false
    expect(result1.current[0]).not.toBe(result2.current[0]); // Should have different refs
  });
});

test('uses provided options and default rootMargin', () => {
  let usedOpts: any;
  const IO = jest.fn((cb, opts) => { usedOpts = opts; return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() }; });
  // @ts-ignore
  global.IntersectionObserver = IO;
  const { result, rerender } = renderHook(() => useInView({ threshold: 0.2 }));
  result.current[0].current = document.createElement('div');
  rerender();
  expect(usedOpts).toEqual({ rootMargin: '1000px 0px', threshold: 0.2 });
});
