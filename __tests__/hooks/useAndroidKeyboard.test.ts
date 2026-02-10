import { renderHook, act } from '@testing-library/react';
import { useAndroidKeyboard } from '@/hooks/useAndroidKeyboard';

const DEBOUNCE_MS = 50;

// Mock Capacitor
const mockAddListener = jest.fn();
const mockIsPluginAvailable = jest.fn();
const mockGetPlatform = jest.fn();

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => mockGetPlatform(),
    isPluginAvailable: (name: string) => mockIsPluginAvailable(name),
  },
}));

jest.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: (event: string, callback: Function) => mockAddListener(event, callback),
  },
}));

describe('useAndroidKeyboard', () => {
  let showCallback: Function;
  let hideCallback: Function;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    showCallback = jest.fn();
    hideCallback = jest.fn();

    // Default: Android platform with Keyboard plugin available
    mockGetPlatform.mockReturnValue('android');
    mockIsPluginAvailable.mockReturnValue(true);

    // Capture callbacks when addListener is called
    mockAddListener.mockImplementation((event: string, callback: Function) => {
      if (event === 'keyboardWillShow') {
        showCallback = callback;
      } else if (event === 'keyboardWillHide') {
        hideCallback = callback;
      }
      return Promise.resolve({ remove: jest.fn() });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with keyboard hidden on Android', () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
    expect(result.current.isAndroid).toBe(true);
  });

  it('does not set up listeners on non-Android platforms', () => {
    mockGetPlatform.mockReturnValue('ios');

    const { result } = renderHook(() => useAndroidKeyboard());

    expect(result.current.isAndroid).toBe(false);
    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('does not set up listeners when Keyboard plugin unavailable', () => {
    mockIsPluginAvailable.mockReturnValue(false);

    renderHook(() => useAndroidKeyboard());

    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('updates state when keyboard shows (after debounce)', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    // Wait for async listener setup
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      showCallback({ keyboardHeight: 350 });
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(350);
  });

  it('updates state when keyboard hides (after debounce)', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    // Wait for async listener setup
    await act(async () => {
      await Promise.resolve();
    });

    // Show keyboard first
    act(() => {
      showCallback({ keyboardHeight: 350 });
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(result.current.isVisible).toBe(true);

    // Hide keyboard
    act(() => {
      hideCallback();
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it('uses fallback height when keyboardHeight is null', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      showCallback({ keyboardHeight: null });
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(result.current.keyboardHeight).toBe(300);
  });

  it('uses fallback height when keyboardHeight is undefined', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      showCallback({});
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(result.current.keyboardHeight).toBe(300);
  });

  it('sets CSS variable when keyboard shows (after debounce)', async () => {
    const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

    renderHook(() => useAndroidKeyboard());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      showCallback({ keyboardHeight: 400 });
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(setPropertySpy).toHaveBeenCalledWith('--android-keyboard-height', '400px');
    setPropertySpy.mockRestore();
  });

  it('clears CSS variable when keyboard hides (after debounce)', async () => {
    const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

    renderHook(() => useAndroidKeyboard());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      hideCallback();
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(setPropertySpy).toHaveBeenCalledWith('--android-keyboard-height', '0px');
    setPropertySpy.mockRestore();
  });

  it('cancels pending hide when show is called', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    await act(async () => {
      await Promise.resolve();
    });

    // Show keyboard
    act(() => {
      showCallback({ keyboardHeight: 350 });
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(result.current.isVisible).toBe(true);

    // Start hiding
    act(() => {
      hideCallback();
      // Don't advance time fully
      jest.advanceTimersByTime(DEBOUNCE_MS / 2);
    });

    // Show again before hide completes
    act(() => {
      showCallback({ keyboardHeight: 400 });
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    // Should still be visible with new height
    expect(result.current.isVisible).toBe(true);
    expect(result.current.keyboardHeight).toBe(400);
  });

  it('does not update state when keyboard events fire after unmount', async () => {
    const { unmount } = renderHook(() => useAndroidKeyboard());

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    // Try to trigger callbacks after unmount - should not throw
    expect(() => {
      showCallback({ keyboardHeight: 500 });
      jest.advanceTimersByTime(DEBOUNCE_MS);
      hideCallback();
      jest.advanceTimersByTime(DEBOUNCE_MS);
    }).not.toThrow();
  });

  describe('getContainerStyle', () => {
    it('returns base style when keyboard is hidden', () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      const style = result.current.getContainerStyle({ color: 'red' });

      expect(style).toEqual({
        color: 'red',
        transition: 'transform 0.1s ease-out',
      });
    });

    it('returns base style on non-Android platforms', () => {
      mockGetPlatform.mockReturnValue('ios');
      const { result } = renderHook(() => useAndroidKeyboard());

      const style = result.current.getContainerStyle({ color: 'blue' });

      expect(style).toEqual({
        color: 'blue',
        transition: 'transform 0.1s ease-out',
      });
    });

    it('applies transform when keyboard is visible', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        showCallback({ keyboardHeight: 400 });
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      const style = result.current.getContainerStyle({});
      expect(style.transform).toBe('translateY(-360px)');
      expect(style.transition).toBe('transform 0.1s ease-out');
    });

    it('subtracts adjustment from keyboard height in transform', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        showCallback({ keyboardHeight: 400 });
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      const style = result.current.getContainerStyle({}, 100);
      expect(style.transform).toBe('translateY(-300px)');
    });

    it('does not apply negative transform', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        showCallback({ keyboardHeight: 50 });
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      const style = result.current.getContainerStyle({}, 100);
      expect(style.transform).toBeUndefined();
    });

    it('preserves existing transition if provided', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        showCallback({ keyboardHeight: 400 });
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      const style = result.current.getContainerStyle({
        transition: 'all 0.3s ease',
      });
      expect(style.transition).toBe('all 0.3s ease');
    });

    it('combines existing transform with keyboard transform', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        showCallback({ keyboardHeight: 400 });
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      const style = result.current.getContainerStyle({
        transform: 'scale(1.1)',
      });
      expect(style.transform).toBe('scale(1.1) translateY(-360px)');
    });
  });

  describe('cleanup', () => {
    it('removes listeners on unmount', async () => {
      const mockRemoveShow = jest.fn();
      const mockRemoveHide = jest.fn();

      mockAddListener.mockImplementation((event: string) => {
        if (event === 'keyboardWillShow') {
          return Promise.resolve({ remove: mockRemoveShow });
        } else if (event === 'keyboardWillHide') {
          return Promise.resolve({ remove: mockRemoveHide });
        }
        return Promise.resolve({ remove: jest.fn() });
      });

      const { unmount } = renderHook(() => useAndroidKeyboard());

      // Wait for async listener setup
      await act(async () => {
        await Promise.resolve();
      });

      unmount();

      expect(mockRemoveShow).toHaveBeenCalled();
      expect(mockRemoveHide).toHaveBeenCalled();
    });

    it('clears CSS variable on unmount', () => {
      const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

      const { unmount } = renderHook(() => useAndroidKeyboard());

      unmount();

      expect(setPropertySpy).toHaveBeenCalledWith('--android-keyboard-height', '0px');
    });

    it('safely clears pending timeouts on unmount without throwing', async () => {
      const { unmount } = renderHook(() => useAndroidKeyboard());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        showCallback({ keyboardHeight: 350 });
      });

      expect(() => unmount()).not.toThrow();

      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS * 2);
      });
    });
  });
});
