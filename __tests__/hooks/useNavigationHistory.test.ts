import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useRouter as useNavRouter } from 'next/navigation';
import { useNavigationHistory } from '../../hooks/useNavigationHistory';

// Mock Next.js routers
jest.mock('next/router');
jest.mock('next/navigation');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseNavRouter = useNavRouter as jest.MockedFunction<typeof useNavRouter>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
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

  it('reads initial state from sessionStorage', () => {
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

    const { result } = renderHook(() => useNavigationHistory());

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

  it('calls navRouter.back when goBack is invoked and can go back', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '1';
        default:
          return 'false';
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    act(() => {
      result.current.goBack();
    });

    expect(mockBack).toHaveBeenCalled();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingBack', 'true');
  });

  it('does not call navRouter.back when cannot go back', () => {
    const { result } = renderHook(() => useNavigationHistory());

    act(() => {
      result.current.goBack();
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Cannot go back', expect.any(Number));
  });

  it('calls navRouter.forward when goForward is invoked and can go forward', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'forwardIndex':
          return '1';
        default:
          return 'false';
      }
    });

    const { result } = renderHook(() => useNavigationHistory());

    act(() => {
      result.current.goForward();
    });

    expect(mockForward).toHaveBeenCalled();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingForward', 'true');
  });

  it('does not call navRouter.forward when cannot go forward', () => {
    const { result } = renderHook(() => useNavigationHistory());

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
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNavigationHistory());

    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('handles pathname change correctly when not going back or forward', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'backIndex':
          return '1';
        case 'isGoingBack':
          return 'false';
        case 'isGoingForward':
          return 'false';
        default:
          return '0';
      }
    });

    const mockRouter = {
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
    };

    mockUseRouter.mockReturnValue(mockRouter);

    renderHook(() => useNavigationHistory());

    // Should increment backIndex and reset forwardIndex to 0
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('backIndex', '2');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('forwardIndex', '0');
  });

  it('handles going back state correctly', () => {
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

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingBack', 'false');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('backIndex', '1');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('forwardIndex', '2');
  });

  it('handles going forward state correctly', () => {
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

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('isGoingForward', 'false');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('backIndex', '2');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('forwardIndex', '1');
  });

  it('handles missing sessionStorage values gracefully', () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useNavigationHistory());

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });
});
