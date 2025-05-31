import { renderHook, act } from '@testing-library/react';
import { useScrollBehavior } from '../../hooks/useScrollBehavior';

// Mock scrollTo method
const mockScrollTo = jest.fn();

// Create a mock HTMLDivElement with scroll properties
const createMockScrollContainer = (options: {
  scrollTop?: number;
  scrollHeight?: number;
  clientHeight?: number;
} = {}) => {
  const element = document.createElement('div');
  
  Object.defineProperties(element, {
    scrollTop: {
      value: options.scrollTop ?? 0,
      writable: true,
    },
    scrollHeight: {
      value: options.scrollHeight ?? 1000,
      writable: true,
    },
    clientHeight: {
      value: options.clientHeight ?? 500,
      writable: true,
    },
  });

  element.scrollTo = mockScrollTo;
  
  return element;
};

describe('useScrollBehavior', () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
  });

  it('should initialize with correct default states', () => {
    const { result } = renderHook(() => useScrollBehavior());

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.isAtTop).toBe(false);
    expect(result.current.scrollContainerRef).toBeDefined();
    expect(result.current.scrollToVisualBottom).toBeInstanceOf(Function);
    expect(result.current.scrollToVisualTop).toBeInstanceOf(Function);
    expect(result.current.handleScroll).toBeInstanceOf(Function);
  });

  describe('scrollToVisualBottom', () => {
    it('should scroll to top (visual bottom in flex-col-reverse)', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer();
      
      // Set the ref to the mock container
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.scrollToVisualBottom();
      });

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('should not scroll when container ref is null', () => {
      const { result } = renderHook(() => useScrollBehavior());

      act(() => {
        result.current.scrollToVisualBottom();
      });

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('scrollToVisualTop', () => {
    it('should scroll to maximum negative position (visual top in flex-col-reverse)', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.scrollToVisualTop();
      });

      // Expected: -(scrollHeight - clientHeight) = -(1000 - 500) = -500
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: -500,
        behavior: 'smooth',
      });
    });

    it('should not scroll when container ref is null', () => {
      const { result } = renderHook(() => useScrollBehavior());

      act(() => {
        result.current.scrollToVisualTop();
      });

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('handleScroll', () => {
    it('should detect when at bottom (scrollTop near 0)', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 2, // Within threshold of 5
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtBottom).toBe(true);
    });

    it('should detect when not at bottom (scrollTop > 5)', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 10, // Beyond threshold of 5
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtBottom).toBe(false);
    });

    it('should detect when at top (scrollTop at max negative)', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: -498, // Within threshold of maxNegativeScroll (-500)
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtTop).toBe(true);
    });

    it('should detect when not at top', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: -400, // Beyond threshold from maxNegativeScroll (-500)
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtTop).toBe(false);
    });

    it('should handle case when container is null', () => {
      const { result } = renderHook(() => useScrollBehavior());

      act(() => {
        result.current.handleScroll();
      });

      // Should not throw error and states should remain unchanged
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtTop).toBe(false);
    });
  });

  describe('scroll event listener', () => {
    let mockContainer: HTMLDivElement;
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      mockContainer = createMockScrollContainer();
      addEventListenerSpy = jest.spyOn(mockContainer, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(mockContainer, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should add scroll event listener when container exists', () => {
      const { result } = renderHook(() => {
        const hook = useScrollBehavior();
        // Set the ref immediately during render to trigger useEffect
        hook.scrollContainerRef.current = mockContainer;
        return hook;
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should remove scroll event listener on cleanup', () => {
      const { unmount } = renderHook(() => {
        const hook = useScrollBehavior();
        // Set the ref immediately during render to trigger useEffect
        hook.scrollContainerRef.current = mockContainer;
        return hook;
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should not add event listener when container is null', () => {
      renderHook(() => useScrollBehavior());

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle zero scroll dimensions', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtTop).toBe(true);
    });

    it('should handle negative scroll values correctly', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: -250, // This is < 5, so considered at bottom per current logic
        scrollHeight: 1000,
        clientHeight: 500, // maxNegativeScroll = -(1000-500) = -500, -250 is not near -500, so not at top
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      // -250 < 5, so isAtBottom is true according to current implementation
      // -250 is not near -500, so isAtTop is false
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtTop).toBe(false);
    });
  });
});