// Mock the useIntersectionObserver hook first
const mockUseIntersectionObserver = jest.fn();
jest.mock('@/hooks/scroll/useIntersectionObserver', () => ({
  __esModule: true,
  useIntersectionObserver: mockUseIntersectionObserver,
}));

import { renderHook } from '@testing-library/react';
import { RefObject } from 'react';
import { useSlideshowAutoplay } from '@/components/nextGen/collections/collectionParts/hooks/useSlideshowAutoplay';

describe('useSlideshowAutoplay', () => {
  // Mock ref object
  const mockSlideshowRef: RefObject<HTMLDivElement> = {
    current: document.createElement('div'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return initial values', () => {
      const { result } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      expect(result.current.isInViewport).toBe(false);
      expect(result.current.setSwiperInstance).toBeInstanceOf(Function);
    });

    it('should call useIntersectionObserver with correct parameters', () => {
      renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      expect(mockUseIntersectionObserver).toHaveBeenCalledWith(
        mockSlideshowRef,
        { threshold: 0.3 },
        expect.any(Function)
      );
    });
  });

  describe('Intersection Observer Callback', () => {
    it('should update isInViewport when intersection changes', () => {
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      // Initially false
      expect(result.current.isInViewport).toBe(false);
      
      // Simulate intersection entry
      const mockEntry = { isIntersecting: true } as IntersectionObserverEntry;
      intersectionCallback(mockEntry);
      
      rerender();
      
      expect(result.current.isInViewport).toBe(true);
    });

    it('should handle leaving viewport', () => {
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      // Enter viewport first
      intersectionCallback({ isIntersecting: true } as IntersectionObserverEntry);
      rerender();
      expect(result.current.isInViewport).toBe(true);
      
      // Then leave viewport
      intersectionCallback({ isIntersecting: false } as IntersectionObserverEntry);
      rerender();
      expect(result.current.isInViewport).toBe(false);
    });
  });

  describe('Swiper Instance Management', () => {
    it('should handle swiper instance with autoplay', () => {
      const mockSwiper = {
        autoplay: {
          start: jest.fn(),
          stop: jest.fn(),
        },
      };
      
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      // Set swiper instance
      result.current.setSwiperInstance(mockSwiper);
      rerender();
      
      // Should stop autoplay initially (because isInViewport is false)
      // Note: useEffect may run multiple times during the hook lifecycle
      expect(mockSwiper.autoplay.stop).toHaveBeenCalled();
      
      // Enter viewport
      intersectionCallback({ isIntersecting: true } as IntersectionObserverEntry);
      rerender();
      
      // Should start autoplay when in viewport
      expect(mockSwiper.autoplay.start).toHaveBeenCalledTimes(1);
      
      // Leave viewport
      intersectionCallback({ isIntersecting: false } as IntersectionObserverEntry);
      rerender();
      
      // Should stop autoplay when leaving viewport 
      // Check that stop was called more than once (initial + when leaving viewport)
      expect(mockSwiper.autoplay.stop.mock.calls.length).toBeGreaterThan(1);
    });

    it('should handle swiper instance without autoplay property', () => {
      const mockSwiper = {};
      
      const { result } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      // Should not throw when setting instance without autoplay
      expect(() => {
        result.current.setSwiperInstance(mockSwiper);
      }).not.toThrow();
    });

    it('should handle null swiper instance', () => {
      const { result } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      // Should not throw when setting null instance
      expect(() => {
        result.current.setSwiperInstance(null);
      }).not.toThrow();
    });
  });

  describe('Autoplay Control Logic', () => {
    it('should stop autoplay initially when swiper is set', () => {
      const mockSwiper = {
        autoplay: {
          start: jest.fn(),
          stop: jest.fn(),
        },
      };
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      result.current.setSwiperInstance(mockSwiper);
      rerender(); // Trigger useEffect
      
      // Should stop autoplay because initially isInViewport is false
      expect(mockSwiper.autoplay.stop).toHaveBeenCalled();
    });

    it('should start autoplay when entering viewport', () => {
      const mockSwiper = {
        autoplay: {
          start: jest.fn(),
          stop: jest.fn(),
        },
      };
      
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      result.current.setSwiperInstance(mockSwiper);
      rerender();
      
      // Clear initial stop call
      jest.clearAllMocks();
      
      // Enter viewport
      intersectionCallback({ isIntersecting: true } as IntersectionObserverEntry);
      rerender();
      
      expect(mockSwiper.autoplay.start).toHaveBeenCalledTimes(1);
      expect(mockSwiper.autoplay.stop).not.toHaveBeenCalled();
    });

    it('should stop autoplay when leaving viewport', () => {
      const mockSwiper = {
        autoplay: {
          start: jest.fn(),
          stop: jest.fn(),
        },
      };
      
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      result.current.setSwiperInstance(mockSwiper);
      rerender();
      
      // Enter viewport first
      intersectionCallback({ isIntersecting: true } as IntersectionObserverEntry);
      rerender();
      
      // Clear previous calls
      jest.clearAllMocks();
      
      // Leave viewport
      intersectionCallback({ isIntersecting: false } as IntersectionObserverEntry);
      rerender();
      
      expect(mockSwiper.autoplay.stop).toHaveBeenCalledTimes(1);
      expect(mockSwiper.autoplay.start).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple swiper instance updates', () => {
      const mockSwiper1 = {
        autoplay: { start: jest.fn(), stop: jest.fn() },
      };
      const mockSwiper2 = {
        autoplay: { start: jest.fn(), stop: jest.fn() },
      };
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      result.current.setSwiperInstance(mockSwiper1);
      rerender();
      expect(mockSwiper1.autoplay.stop).toHaveBeenCalled();
      
      result.current.setSwiperInstance(mockSwiper2);
      rerender();
      expect(mockSwiper2.autoplay.stop).toHaveBeenCalled();
    });

    it('should handle viewport changes without swiper instance', () => {
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      // Should not throw when viewport changes without swiper
      expect(() => {
        intersectionCallback({ isIntersecting: true } as IntersectionObserverEntry);
        rerender();
        intersectionCallback({ isIntersecting: false } as IntersectionObserverEntry);
        rerender();
      }).not.toThrow();
      
      expect(result.current.isInViewport).toBe(false);
    });
  });

  describe('Return Value Consistency', () => {
    it('should maintain stable setSwiperInstance reference', () => {
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      const initialSetSwiperInstance = result.current.setSwiperInstance;
      
      rerender();
      
      expect(result.current.setSwiperInstance).toBe(initialSetSwiperInstance);
    });

    it('should update isInViewport correctly', () => {
      let intersectionCallback: (entry: IntersectionObserverEntry) => void = () => {};
      
      mockUseIntersectionObserver.mockImplementation((ref, options, callback) => {
        intersectionCallback = callback;
      });
      
      const { result, rerender } = renderHook(() => useSlideshowAutoplay(mockSlideshowRef));
      
      expect(result.current.isInViewport).toBe(false);
      
      intersectionCallback({ isIntersecting: true } as IntersectionObserverEntry);
      rerender();
      
      expect(result.current.isInViewport).toBe(true);
    });
  });
});
