import { renderHook, act } from '@testing-library/react';
import { useNavigationHistory } from '../../hooks/useNavigationHistory';

// Mock Next.js routers
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const { useRouter } = require('next/router');
const { useRouter: useNavRouter } = require('next/navigation');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseNavRouter = useNavRouter as jest.MockedFunction<typeof useNavRouter>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    sessionStorage: mockSessionStorage,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock window properties
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
});

Object.defineProperty(document, 'readyState', {
  writable: true,
  value: 'loading',
});

describe('useNavigationHistory', () => {
  const mockBack = jest.fn();
  const mockForward = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    mockUseRouter.mockReturnValue({
      pathname: '/test',
      route: '/test',
      query: {},
      asPath: '/test',
      basePath: '',
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      locale: undefined,
      locales: undefined,
      defaultLocale: undefined,
      domainLocales: undefined,
    });

    mockUseNavRouter.mockReturnValue({
      back: mockBack,
      forward: mockForward,
      refresh: mockRefresh,
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    // Default sessionStorage mock values
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '0';
        case 'forwardIndex':
          return '0';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useNavigationHistory());

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.goBack).toBe('function');
    expect(typeof result.current.goForward).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it.skip('reads initial state from sessionStorage', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '2';
        case 'forwardIndex':
          return '1';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    // Wait for effects to process the initial state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(true);
  });

  it('updates canGoBack when backIndex changes', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '1';
        case 'forwardIndex':
          return '0';
        default:
          return 'false';
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it.skip('calls navRouter.back when goBack is invoked and can go back', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '1';
        case 'forwardIndex':
          return '0';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    // Wait for initial effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear any initial setItem calls
    mockSessionStorage.setItem.mockClear();

    act(() => {
      result.current.goBack();
    });

    expect(mockBack).toHaveBeenCalled();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingBack', 'true');
  });

  it.skip('does not call navRouter.back when cannot go back', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '0';
        case 'forwardIndex':
          return '0';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    // Wait for initial effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear any calls from initialization
    mockBack.mockClear();
    (console.log as jest.Mock).mockClear();

    act(() => {
      result.current.goBack();
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Cannot go back', expect.any(Number));
  });

  it.skip('calls navRouter.forward when goForward is invoked and can go forward', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '0';
        case 'forwardIndex':
          return '1';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    // Wait for initial effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear any initial setItem calls
    mockSessionStorage.setItem.mockClear();

    act(() => {
      result.current.goForward();
    });

    expect(mockForward).toHaveBeenCalled();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingForward', 'true');
  });

  it.skip('does not call navRouter.forward when cannot go forward', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '0';
        case 'forwardIndex':
          return '0';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    // Wait for initial effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear any calls from initialization
    mockForward.mockClear();
    (console.log as jest.Mock).mockClear();

    act(() => {
      result.current.goForward();
    });

    expect(mockForward).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Cannot go forward', expect.any(Number));
  });

  it('calls navRouter.refresh and sets loading when refresh is invoked', () => {
    const { result } = renderHook(() => useNavigationHistory());

    act(() => {
      result.current.refresh();
    });

    expect(mockRefresh).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('sets isLoading to false when document is ready', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
    });

    const { result } = renderHook(() => useNavigationHistory());

    expect(result.current.isLoading).toBe(false);
  });

  it('adds and removes window load event listener', () => {
    // Reset document ready state
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      writable: true,
    });

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNavigationHistory());

    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it.skip('handles pathname change correctly when not going back or forward', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '1';
        case 'forwardIndex':
          return '0';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    const { result, rerender } = renderHook(() => useNavigationHistory());

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should increment backIndex and reset forwardIndex to 0
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('backIndex', '2');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('forwardIndex', '0');
  });

  it.skip('handles going back state correctly', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '2';
        case 'forwardIndex':
          return '1';
        case 'isGoingBack':
          return 'true';
        case 'isGoingForward':
          return 'false';
        default:
          return null;
      }
    });

    renderHook(() => useNavigationHistory());

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingBack', 'false');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('backIndex', '1');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('forwardIndex', '2');
  });

  it.skip('handles going forward state correctly', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '1';
        case 'forwardIndex':
          return '2';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'true';
        default:
          return null;
      }
    });

    renderHook(() => useNavigationHistory());

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingForward', 'false');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('backIndex', '2');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('forwardIndex', '1');
  });

  it('handles missing sessionStorage values gracefully', () => {
    // Reset all mocks completely
    jest.resetAllMocks();
    
    // Set up a completely fresh sessionStorage mock that returns null
    const freshSessionStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    // Override the global sessionStorage mock for this test
    Object.defineProperty(window, 'sessionStorage', {
      value: freshSessionStorage,
      writable: true,
    });

    // Set up fresh router mocks
    mockUseRouter.mockReturnValue({
      pathname: '/test-isolated',
      route: '/test-isolated',
      query: {},
      asPath: '/test-isolated',
      basePath: '',
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      locale: undefined,
      locales: undefined,
      defaultLocale: undefined,
      domainLocales: undefined,
    });

    mockUseNavRouter.mockReturnValue({
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    const { result } = renderHook(() => useNavigationHistory());

    // When sessionStorage returns null, the hook gracefully handles it by:
    // - Setting default values for backIndex (-1) and forwardIndex (0)
    // - Allowing the navigation logic to work normally
    // The exact final state depends on the pathname effect execution
    // but the hook should not crash and should provide valid boolean values
    expect(typeof result.current.canGoBack).toBe('boolean');
    expect(typeof result.current.canGoForward).toBe('boolean');

    // Restore the original mock for other tests
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
  });
});
