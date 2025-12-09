import { renderHook, act, waitFor } from '@testing-library/react';
import { useAndroidKeyboard } from '@/hooks/useAndroidKeyboard';

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
      return { remove: jest.fn() };
    });
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

  it('updates state when keyboard shows', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    act(() => {
      showCallback({ keyboardHeight: 350 });
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
      expect(result.current.keyboardHeight).toBe(350);
    });
  });

  it('updates state when keyboard hides', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    // Show keyboard first
    act(() => {
      showCallback({ keyboardHeight: 350 });
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });

    // Hide keyboard
    act(() => {
      hideCallback();
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
      expect(result.current.keyboardHeight).toBe(0);
    });
  });

  it('uses fallback height when keyboardHeight is null', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    act(() => {
      showCallback({ keyboardHeight: null });
    });

    await waitFor(() => {
      expect(result.current.keyboardHeight).toBe(300);
    });
  });

  it('uses fallback height when keyboardHeight is undefined', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    act(() => {
      showCallback({});
    });

    await waitFor(() => {
      expect(result.current.keyboardHeight).toBe(300);
    });
  });

  it('uses actual height of 0 if provided (not fallback)', async () => {
    const { result } = renderHook(() => useAndroidKeyboard());

    act(() => {
      showCallback({ keyboardHeight: 0 });
    });

    await waitFor(() => {
      expect(result.current.keyboardHeight).toBe(0);
    });
  });

  it('sets CSS variable when keyboard shows', () => {
    const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

    renderHook(() => useAndroidKeyboard());

    act(() => {
      showCallback({ keyboardHeight: 400 });
    });

    expect(setPropertySpy).toHaveBeenCalledWith('--android-keyboard-height', '400px');
  });

  it('clears CSS variable when keyboard hides', () => {
    const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

    renderHook(() => useAndroidKeyboard());

    act(() => {
      hideCallback();
    });

    expect(setPropertySpy).toHaveBeenCalledWith('--android-keyboard-height', '0px');
    setPropertySpy.mockRestore();
  });

  it('does not update state if unmounted before listener setup completes', async () => {
    let resolveListener: any;

    // Make addListener async to simulate delay
    mockAddListener.mockImplementation(() => {
      return new Promise((resolve) => {
        resolveListener = resolve;
      });
    });

    const { unmount } = renderHook(() => useAndroidKeyboard());

    // Unmount before listener setup completes
    unmount();

    // Now resolve the listener setup
    const mockRemove = jest.fn();
    act(() => {
      resolveListener?.({ remove: mockRemove });
    });

    // Listener should be immediately removed since component unmounted
    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  it('does not update state when keyboard events fire after unmount', async () => {
    const { unmount } = renderHook(() => useAndroidKeyboard());

    unmount();

    // Try to trigger callbacks after unmount
    act(() => {
      showCallback({ keyboardHeight: 500 });
    });

    // State should not have changed (we can't access result.current after unmount,
    // but this test ensures no errors are thrown)
    expect(() => {
      showCallback({ keyboardHeight: 500 });
      hideCallback();
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

      act(() => {
        showCallback({ keyboardHeight: 400 });
      });

      await waitFor(() => {
        const style = result.current.getContainerStyle({});

        expect(style.transform).toBe('translateY(-360px)');
        expect(style.transition).toBe('transform 0.1s ease-out');
      });
    });

    it('subtracts adjustment from keyboard height in transform', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      act(() => {
        showCallback({ keyboardHeight: 400 });
      });

      await waitFor(() => {
        const style = result.current.getContainerStyle({}, 100);

        expect(style.transform).toBe('translateY(-300px)');
      });
    });

    it('does not apply negative transform', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      act(() => {
        showCallback({ keyboardHeight: 50 });
      });

      await waitFor(() => {
        const style = result.current.getContainerStyle({}, 100);

        expect(style.transform).toBe('');
      });
    });

    it('preserves existing transition if provided', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      act(() => {
        showCallback({ keyboardHeight: 400 });
      });

      await waitFor(() => {
        const style = result.current.getContainerStyle({
          transition: 'all 0.3s ease',
        });

        expect(style.transition).toBe('all 0.3s ease');
      });
    });

    it('combines existing transform with keyboard transform', async () => {
      const { result } = renderHook(() => useAndroidKeyboard());

      act(() => {
        showCallback({ keyboardHeight: 400 });
      });

      await waitFor(() => {
        const style = result.current.getContainerStyle({
          transform: 'scale(1.1)',
        });

        expect(style.transform).toBe('scale(1.1) translateY(-360px)');
      });
    });
  });

  describe('cleanup', () => {
    it('removes listeners on unmount', () => {
      const mockRemoveShow = jest.fn();
      const mockRemoveHide = jest.fn();

      mockAddListener.mockImplementation((event: string) => {
        if (event === 'keyboardWillShow') {
          return { remove: mockRemoveShow };
        } else if (event === 'keyboardWillHide') {
          return { remove: mockRemoveHide };
        }
        return { remove: jest.fn() };
      });

      const { unmount } = renderHook(() => useAndroidKeyboard());

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
  });
});
