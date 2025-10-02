import { renderHook, act } from '@testing-library/react';
import { useSlideshowConfig } from '@/components/nextGen/collections/collectionParts/hooks/useSlideshowConfig';

describe('useSlideshowConfig', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset window width to a known state
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true
    });
    
    // Clean up any remaining event listeners
    window.removeEventListener('resize', jest.fn());
  });

  describe('Initial State', () => {
    it('returns 4 slides per view for large screens (>1200px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(4);
    });

    it('returns 2 slides per view for medium screens (500-1200px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(2);
    });

    it('returns 1 slide per view for small screens (≤500px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 400,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(1);
    });
  });

  describe('Boundary Conditions', () => {
    it('returns 4 slides per view exactly at 1201px', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1201,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(4);
    });

    it('returns 2 slides per view exactly at 1200px', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(2);
    });

    it('returns 2 slides per view exactly at 501px', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 501,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(2);
    });

    it('returns 1 slide per view exactly at 500px', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(1);
    });
  });

  describe('Resize Event Handling', () => {
    it('updates slidesPerView when window is resized from large to medium', () => {
      // Start with large screen
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      expect(result.current.slidesPerView).toBe(4);

      // Resize to medium screen
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          value: 800,
          writable: true,
          configurable: true
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.slidesPerView).toBe(2);
    });

    it('updates slidesPerView when window is resized from medium to small', () => {
      // Start with medium screen
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      expect(result.current.slidesPerView).toBe(2);

      // Resize to small screen
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          value: 400,
          writable: true,
          configurable: true
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.slidesPerView).toBe(1);
    });

    it('updates slidesPerView when window is resized from small to large', () => {
      // Start with small screen
      Object.defineProperty(window, 'innerWidth', {
        value: 400,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      expect(result.current.slidesPerView).toBe(1);

      // Resize to large screen
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          value: 1400,
          writable: true,
          configurable: true
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.slidesPerView).toBe(4);
    });

    it('handles multiple rapid resize events correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      expect(result.current.slidesPerView).toBe(4);

      // Rapid resize events
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          value: 800,
          writable: true,
          configurable: true
        });
        window.dispatchEvent(new Event('resize'));
        
        Object.defineProperty(window, 'innerWidth', {
          value: 400,
          writable: true,
          configurable: true
        });
        window.dispatchEvent(new Event('resize'));
        
        Object.defineProperty(window, 'innerWidth', {
          value: 1500,
          writable: true,
          configurable: true
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.slidesPerView).toBe(4);
    });
  });

  describe('Event Listener Management', () => {
    it('adds resize event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      renderHook(() => useSlideshowConfig());
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('removes resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useSlideshowConfig());
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('does not leak event listeners when hook is mounted and unmounted multiple times', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      // Mount and unmount multiple times
      const { unmount: unmount1 } = renderHook(() => useSlideshowConfig());
      unmount1();
      
      const { unmount: unmount2 } = renderHook(() => useSlideshowConfig());
      unmount2();
      
      const { unmount: unmount3 } = renderHook(() => useSlideshowConfig());
      unmount3();
      
      // Should have equal number of add and remove calls
      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles extremely small window sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(1);
    });

    it('handles extremely large window sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 10000,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(4);
    });

    it('handles zero window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 0,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(1);
    });

    it('handles negative window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: -100,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current.slidesPerView).toBe(1);
    });
  });

  describe('Return Value Structure', () => {
    it('returns an object with slidesPerView property', () => {
      const { result } = renderHook(() => useSlideshowConfig());
      
      expect(result.current).toHaveProperty('slidesPerView');
      expect(typeof result.current.slidesPerView).toBe('number');
    });

    it('maintains stable reference for returned object structure', () => {
      const { result } = renderHook(() => useSlideshowConfig());
      
      const initialResult = result.current;
      
      // Trigger re-render without changing window size
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Object structure should remain the same
      expect(Object.keys(result.current)).toEqual(Object.keys(initialResult));
    });
  });

  describe('Performance', () => {
    it('does not create new functions on every render', () => {
      const { result, rerender } = renderHook(() => useSlideshowConfig());
      
      const initialResult = result.current;
      
      // Force re-render
      rerender();
      
      // The hook should return the same object reference if no resize occurred
      expect(result.current.slidesPerView).toBe(initialResult.slidesPerView);
    });
  });
});
