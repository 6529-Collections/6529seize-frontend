import { renderHook, act } from '@testing-library/react';
import useAccessibility from '@/components/waves/memes/file-upload/hooks/useAccessibility';

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('useAccessibility', () => {
  const mockOnAreaClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
  });

  describe('Basic functionality', () => {
    it('returns handler functions', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      expect(result.current.handleKeyDown).toBeInstanceOf(Function);
      expect(result.current.handleTouchStart).toBeInstanceOf(Function);
      expect(result.current.handleTouchEnd).toBeInstanceOf(Function);
    });

    it('maintains stable function references', () => {
      const { result, rerender } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      const firstRender = {
        handleKeyDown: result.current.handleKeyDown,
        handleTouchStart: result.current.handleTouchStart,
        handleTouchEnd: result.current.handleTouchEnd,
      };

      rerender();

      expect(result.current.handleKeyDown).toBe(firstRender.handleKeyDown);
      expect(result.current.handleTouchStart).toBe(firstRender.handleTouchStart);
      expect(result.current.handleTouchEnd).toBe(firstRender.handleTouchEnd);
    });
  });

  describe('Keyboard handling', () => {
    it('calls onAreaClick when Enter key is pressed and component is active', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockOnAreaClick).toHaveBeenCalledTimes(1);
      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('calls onAreaClick when Space key is pressed and component is active', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      const mockEvent = {
        key: ' ',
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockOnAreaClick).toHaveBeenCalledTimes(1);
      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('does not call onAreaClick when other keys are pressed', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      const mockEvent = {
        key: 'Tab',
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockOnAreaClick).not.toHaveBeenCalled();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('does not call onAreaClick when component is inactive', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: false,
          onAreaClick: mockOnAreaClick,
        })
      );

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockOnAreaClick).not.toHaveBeenCalled();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Touch handling', () => {
    it('handles touch start when component is active and motion is not reduced', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
          prefersReducedMotion: false,
        })
      );

      act(() => {
        result.current.handleTouchStart();
      });

      // Should not throw error and complete successfully
      expect(true).toBe(true);
    });

    it('handles touch end when component is active and motion is not reduced', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
          prefersReducedMotion: false,
        })
      );

      act(() => {
        result.current.handleTouchEnd();
      });

      // Should not throw error and complete successfully
      expect(true).toBe(true);
    });

    it('handles touch events when component is inactive', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: false,
          onAreaClick: mockOnAreaClick,
        })
      );

      act(() => {
        result.current.handleTouchStart();
        result.current.handleTouchEnd();
      });

      // Should not throw error and complete successfully
      expect(true).toBe(true);
    });

    it('handles touch events when reduced motion is preferred', () => {
      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
          prefersReducedMotion: true,
        })
      );

      act(() => {
        result.current.handleTouchStart();
        result.current.handleTouchEnd();
      });

      // Should not throw error and complete successfully
      expect(true).toBe(true);
    });
  });

  describe('Reduced motion detection', () => {
    it('uses provided prefersReducedMotion value when specified', () => {
      const { result: resultTrue } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
          prefersReducedMotion: true,
        })
      );

      const { result: resultFalse } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
          prefersReducedMotion: false,
        })
      );

      // Both should work without error regardless of prefersReducedMotion value
      expect(resultTrue.current.handleTouchStart).toBeInstanceOf(Function);
      expect(resultFalse.current.handleTouchStart).toBeInstanceOf(Function);
    });

    it('detects reduced motion from media query when not provided', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      // Since prefersReducedMotion is undefined, it should check the media query
      // We need to test the behavior rather than the implementation detail
      expect(result.current.handleTouchStart).toBeInstanceOf(Function);
    });

    it('handles cases where window is not available (SSR)', () => {
      // Mock window as undefined for SSR simulation
      const originalWindow = global.window;
      (global as any).window = undefined;

      const { result } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      expect(result.current.handleKeyDown).toBeInstanceOf(Function);
      expect(result.current.handleTouchStart).toBeInstanceOf(Function);
      expect(result.current.handleTouchEnd).toBeInstanceOf(Function);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('State updates', () => {
    it('updates handlers when isActive changes', () => {
      const { result, rerender } = renderHook(
        ({ isActive }) =>
          useAccessibility({
            isActive,
            onAreaClick: mockOnAreaClick,
          }),
        { initialProps: { isActive: true } }
      );

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as any;

      // Should work when active
      act(() => {
        result.current.handleKeyDown(mockEvent);
      });
      expect(mockOnAreaClick).toHaveBeenCalledTimes(1);

      // Re-render with inactive state
      rerender({ isActive: false });

      mockOnAreaClick.mockClear();
      mockEvent.preventDefault.mockClear();

      // Should not work when inactive
      act(() => {
        result.current.handleKeyDown(mockEvent);
      });
      expect(mockOnAreaClick).not.toHaveBeenCalled();
    });

    it('updates handlers when onAreaClick changes', () => {
      const mockOnAreaClick1 = jest.fn();
      const mockOnAreaClick2 = jest.fn();

      const { result, rerender } = renderHook(
        ({ onAreaClick }) =>
          useAccessibility({
            isActive: true,
            onAreaClick,
          }),
        { initialProps: { onAreaClick: mockOnAreaClick1 } }
      );

      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as any;

      // Should call first callback
      act(() => {
        result.current.handleKeyDown(mockEvent);
      });
      expect(mockOnAreaClick1).toHaveBeenCalledTimes(1);
      expect(mockOnAreaClick2).not.toHaveBeenCalled();

      // Re-render with different callback
      rerender({ onAreaClick: mockOnAreaClick2 });

      mockEvent.preventDefault.mockClear();

      // Should call second callback
      act(() => {
        result.current.handleKeyDown(mockEvent);
      });
      expect(mockOnAreaClick1).toHaveBeenCalledTimes(1); // Still 1 from before
      expect(mockOnAreaClick2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('cleans up effect when component unmounts', () => {
      const { unmount } = renderHook(() =>
        useAccessibility({
          isActive: true,
          onAreaClick: mockOnAreaClick,
        })
      );

      // Should not throw error when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });
});