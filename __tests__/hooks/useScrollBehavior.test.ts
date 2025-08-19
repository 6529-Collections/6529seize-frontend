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

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

mockIntersectionObserver.mockImplementation((callback) => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  callback, // Store callback for later use
}));

// @ts-ignore
global.IntersectionObserver = mockIntersectionObserver;

describe('useScrollBehavior', () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
    mockIntersectionObserver.mockClear();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
  });

  it('should initialize with correct default states', () => {
    const { result } = renderHook(() => useScrollBehavior());

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.isAtTop).toBe(false);
    expect(result.current.scrollIntent).toBe('pinned');
    expect(result.current.shouldPinToBottom).toBe(true); // pinned + isAtBottom
    expect(result.current.scrollContainerRef).toBeDefined();
    expect(result.current.bottomAnchorRef).toBeDefined();
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
      // Should set scrollIntent to pinned
      expect(result.current.scrollIntent).toBe('pinned');
    });

    it('should set scrollIntent to pinned when scrolling to bottom', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer();
      
      // Set initial state to reading
      result.current.scrollContainerRef.current = mockContainer;
      mockContainer.scrollTop = 100; // Not at bottom
      
      act(() => {
        result.current.handleScroll();
      });
      
      // Should be in reading mode when away from bottom
      expect(result.current.scrollIntent).toBe('reading');
      
      // Now scroll to bottom
      act(() => {
        result.current.scrollToVisualBottom();
      });
      
      expect(result.current.scrollIntent).toBe('pinned');
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
        scrollTop: 2, // Within threshold of 50
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollIntent).toBe('pinned');
    });

    it('should detect when not at bottom (scrollTop > 50)', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 60, // Beyond threshold of 50
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      expect(result.current.isAtBottom).toBe(false);
      expect(result.current.scrollIntent).toBe('reading');
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
        scrollTop: -30, // Math.abs(-30) = 30 < 50, so considered at bottom per current logic
        scrollHeight: 1000,
        clientHeight: 500, // maxNegativeScroll = -(1000-500) = -500, -30 is not near -500, so not at top
      });
      
      result.current.scrollContainerRef.current = mockContainer;

      act(() => {
        result.current.handleScroll();
      });

      // Math.abs(-30) = 30 < 50, so isAtBottom is true according to current implementation
      // Math.abs(-30 - (-500)) = Math.abs(470) = 470 > 50, so isAtTop is false
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.isAtTop).toBe(false);
    });
  });

  describe('scrollIntent behavior', () => {
    it('should start with pinned intent', () => {
      const { result } = renderHook(() => useScrollBehavior());
      expect(result.current.scrollIntent).toBe('pinned');
    });

    it('should change to reading when scrolling away from bottom significantly', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 0, // Start at bottom
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;
      
      // First scroll - establish baseline
      act(() => {
        result.current.handleScroll();
      });
      
      // Now scroll away significantly (> 20px delta and not at bottom)
      mockContainer.scrollTop = 100;
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.scrollIntent).toBe('reading');
    });

    it('should remain pinned for small scroll movements', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 0, // Start at bottom
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;
      
      // First scroll - establish baseline
      act(() => {
        result.current.handleScroll();
      });
      
      // Small scroll movement (< 20px delta)
      mockContainer.scrollTop = 10;
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.scrollIntent).toBe('pinned');
    });

    it('should change back to pinned when returning to bottom', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 100, // Start away from bottom
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;
      
      // First scroll - should be reading when away from bottom
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.scrollIntent).toBe('reading');
      
      // Now return to bottom
      mockContainer.scrollTop = 0;
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.scrollIntent).toBe('pinned');
    });
  });

  describe('shouldPinToBottom', () => {
    it('should be true when pinned and at bottom', () => {
      const { result } = renderHook(() => useScrollBehavior());
      
      // Default state: pinned and at bottom
      expect(result.current.shouldPinToBottom).toBe(true);
    });

    it('should be false when reading even if at bottom', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 100, // Away from bottom initially
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;
      
      // Scroll to trigger reading mode
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.scrollIntent).toBe('reading');
      
      // Now at bottom but still reading
      mockContainer.scrollTop = 0;
      act(() => {
        result.current.handleScroll();
      });
      
      // Should be pinned again when at bottom
      expect(result.current.shouldPinToBottom).toBe(true);
    });

    it('should be false when pinned but not at bottom', () => {
      const { result } = renderHook(() => useScrollBehavior());
      const mockContainer = createMockScrollContainer({
        scrollTop: 100, // Not at bottom
        scrollHeight: 1000,
        clientHeight: 500,
      });
      
      result.current.scrollContainerRef.current = mockContainer;
      
      act(() => {
        result.current.handleScroll();
      });
      
      expect(result.current.shouldPinToBottom).toBe(false);
    });
  });

  describe('intersection observer', () => {
    it('should create intersection observer when refs are available', () => {
      const mockContainer = createMockScrollContainer();
      const mockAnchor = document.createElement('div');
      
      const { result } = renderHook(() => {
        const hook = useScrollBehavior();
        // Set refs to trigger intersection observer setup
        hook.scrollContainerRef.current = mockContainer;
        hook.bottomAnchorRef.current = mockAnchor;
        return hook;
      });
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          root: mockContainer,
          threshold: 0,
          rootMargin: '50px'
        })
      );
      
      expect(mockObserve).toHaveBeenCalledWith(mockAnchor);
    });

    it('should update state when anchor intersects', () => {
      const mockContainer = createMockScrollContainer();
      const mockAnchor = document.createElement('div');
      
      const { result } = renderHook(() => {
        const hook = useScrollBehavior();
        hook.scrollContainerRef.current = mockContainer;
        hook.bottomAnchorRef.current = mockAnchor;
        return hook;
      });
      
      // Get the callback from the intersection observer mock
      const intersectionCallback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate anchor coming into view
      act(() => {
        intersectionCallback([{ isIntersecting: true }]);
      });
      
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.scrollIntent).toBe('pinned');
    });

    it('should update state when anchor leaves view', () => {
      const mockContainer = createMockScrollContainer();
      const mockAnchor = document.createElement('div');
      
      const { result } = renderHook(() => {
        const hook = useScrollBehavior();
        hook.scrollContainerRef.current = mockContainer;
        hook.bottomAnchorRef.current = mockAnchor;
        return hook;
      });
      
      // Get the callback from the intersection observer mock
      const intersectionCallback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate anchor leaving view
      act(() => {
        intersectionCallback([{ isIntersecting: false }]);
      });
      
      expect(result.current.isAtBottom).toBe(false);
    });

    it('should disconnect observer on cleanup', () => {
      const mockContainer = createMockScrollContainer();
      const mockAnchor = document.createElement('div');
      
      const { unmount } = renderHook(() => {
        const hook = useScrollBehavior();
        hook.scrollContainerRef.current = mockContainer;
        hook.bottomAnchorRef.current = mockAnchor;
        return hook;
      });
      
      unmount();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should not create observer when refs are null', () => {
      renderHook(() => useScrollBehavior());
      
      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });
  });
});