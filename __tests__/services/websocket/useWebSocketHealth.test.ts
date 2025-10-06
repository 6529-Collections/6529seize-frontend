import { act, renderHook } from '@testing-library/react';
import { useWebSocketHealth } from '@/services/websocket/useWebSocketHealth';
import { WebSocketStatus } from '@/services/websocket/WebSocketTypes';
import { useWebSocket } from '@/services/websocket/useWebSocket';
import { getAuthJwt, WALLET_AUTH_COOKIE } from '@/services/auth/auth.utils';

jest.mock('@/services/websocket/useWebSocket');
jest.mock('@/services/auth/auth.utils', () => ({
  getAuthJwt: jest.fn(),
  WALLET_AUTH_COOKIE: 'wallet-auth',
}));

type CookieChangeEvent = {
  changed?: Array<{ name: string }>;
  deleted?: Array<{ name: string }>;
};

class MockBroadcastChannel {
  public static instances: MockBroadcastChannel[] = [];

  public readonly name: string;
  public readonly addEventListener = jest.fn(
    (type: string, listener: EventListener) => {
      if (type === 'message') {
        this.messageListeners.add(listener);
      }
    }
  );
  public readonly removeEventListener = jest.fn(
    (type: string, listener: EventListener) => {
      if (type === 'message') {
        this.messageListeners.delete(listener);
      }
    }
  );
  public readonly postMessage = jest.fn();
  public readonly close = jest.fn();
  private readonly messageListeners = new Set<EventListener>();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  dispatch(data: unknown) {
    this.messageListeners.forEach((listener) => {
      if (typeof listener === 'function') {
        (listener as (event: MessageEvent) => void)({
          data,
        } as MessageEvent);
      } else if (typeof (listener as EventListenerObject).handleEvent === 'function') {
        (listener as EventListenerObject).handleEvent({
          data,
        } as MessageEvent);
      }
    });
  }
}

const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;
const mockGetAuthJwt = getAuthJwt as jest.Mock;
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

let setIntervalSpy: jest.SpyInstance;
let clearIntervalSpy: jest.SpyInstance;
const setupCookieStoreWithAddEventListener = () => {
  const listeners = new Set<(event: CookieChangeEvent) => void>();
  const cookieStoreMock = {
    addEventListener: jest.fn(
      (type: string, listener: (event: CookieChangeEvent) => void) => {
        if (type === 'change') {
          listeners.add(listener);
        }
      }
    ),
    removeEventListener: jest.fn(
      (type: string, listener: (event: CookieChangeEvent) => void) => {
        if (type === 'change') {
          listeners.delete(listener);
        }
      }
    ),
  };

  Object.assign(window, { cookieStore: cookieStoreMock });

  return {
    cookieStoreMock,
    trigger: (event: CookieChangeEvent) => {
      listeners.forEach((listener) => listener(event));
    },
  };
};

const setupCookieStoreWithOnChange = (
  initialHandler: ((event: CookieChangeEvent) => void) | null = jest.fn()
) => {
  const cookieStoreMock: { onchange: ((event: CookieChangeEvent) => void) | null } = {
    onchange: initialHandler,
  };

  Object.assign(window, { cookieStore: cookieStoreMock });

  return {
    cookieStoreMock,
    trigger: (event: CookieChangeEvent) => {
      cookieStoreMock.onchange?.(event);
    },
  };
};

beforeAll(() => {
  jest.useFakeTimers();
  setIntervalSpy = jest.spyOn(window, 'setInterval');
  clearIntervalSpy = jest.spyOn(window, 'clearInterval');
});

afterAll(() => {
  setIntervalSpy.mockRestore();
  clearIntervalSpy.mockRestore();
  jest.useRealTimers();
});
describe('useWebSocketHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockUseWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.DISCONNECTED,
    });
    mockGetAuthJwt.mockReturnValue(null);
    delete (window as any).cookieStore;
    delete (window as any).BroadcastChannel;
    MockBroadcastChannel.instances = [];
  });

  afterEach(() => {
    jest.clearAllTimers();
    delete (window as any).cookieStore;
    delete (window as any).BroadcastChannel;
  });

  it('connects immediately when a token is available', () => {
    mockGetAuthJwt.mockReturnValue('initial-token');

    renderHook(() => useWebSocketHealth());

    expect(mockConnect).toHaveBeenCalledWith('initial-token');
    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it('disconnects when no token is present but the socket is connected', () => {
    mockGetAuthJwt.mockReturnValue(null);
    mockUseWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.CONNECTED,
    });

    renderHook(() => useWebSocketHealth());

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('sets a 10 second health-check interval and reacts on timer', () => {
    mockGetAuthJwt.mockReturnValue(null);
    renderHook(() => useWebSocketHealth());

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);

    mockGetAuthJwt.mockReturnValue('timed-token');

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockConnect).toHaveBeenCalledWith('timed-token');
  });
  it('responds to cookieStore change events when available', () => {
    const { cookieStoreMock, trigger } = setupCookieStoreWithAddEventListener();

    mockGetAuthJwt.mockReturnValue('token-a');
    mockUseWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.CONNECTED,
    });

    renderHook(() => useWebSocketHealth());

    expect(cookieStoreMock.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );

    mockConnect.mockClear();
    mockGetAuthJwt.mockReturnValue('token-b');

    act(() => {
      trigger({
        changed: [{ name: WALLET_AUTH_COOKIE }],
      });
    });

    expect(mockConnect).toHaveBeenCalledWith('token-b');

    mockDisconnect.mockClear();
    mockGetAuthJwt.mockReturnValue(null);

    act(() => {
      trigger({
        deleted: [{ name: WALLET_AUTH_COOKIE }],
      });
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('cleans up cookieStore event listeners on unmount', () => {
    const { cookieStoreMock } = setupCookieStoreWithAddEventListener();

    const { unmount } = renderHook(() => useWebSocketHealth());

    const addListenerArgs = cookieStoreMock.addEventListener.mock.calls[0];

    unmount();

    expect(cookieStoreMock.removeEventListener).toHaveBeenCalledWith(
      addListenerArgs[0],
      addListenerArgs[1]
    );
  });

  it('supports cookieStore onchange handler fallback', () => {
    const existingHandler = jest.fn();
    const { cookieStoreMock, trigger } = setupCookieStoreWithOnChange(existingHandler);

    mockGetAuthJwt.mockReturnValue('primary-token');

    const { unmount } = renderHook(() => useWebSocketHealth());

    expect(cookieStoreMock.onchange).not.toBe(existingHandler);

    mockConnect.mockClear();
    mockGetAuthJwt.mockReturnValue('updated-token');

    act(() => {
      trigger({ changed: [{ name: WALLET_AUTH_COOKIE }] });
    });

    expect(mockConnect).toHaveBeenCalledWith('updated-token');
    expect(existingHandler).toHaveBeenCalledTimes(1);

    unmount();

    expect(cookieStoreMock.onchange).toBe(existingHandler);
  });

  it('uses BroadcastChannel messages when cookieStore is unavailable', () => {
    (window as any).BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;

    mockGetAuthJwt.mockReturnValue('token-1');
    mockUseWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.DISCONNECTED,
    });

    const { unmount } = renderHook(() => useWebSocketHealth());

    const channel = MockBroadcastChannel.instances[0];
    expect(channel).toBeDefined();
    expect(channel.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

    const messageHandler = channel.addEventListener.mock.calls[0][1] as EventListener;

    mockConnect.mockClear();
    mockGetAuthJwt.mockReturnValue('token-2');

    act(() => {
      (messageHandler as (event: MessageEvent) => void)({
        data: { type: 'auth-token-changed' },
      } as MessageEvent);
    });

    expect(mockConnect).toHaveBeenCalledWith('token-2');

    unmount();

    expect(channel.removeEventListener).toHaveBeenCalledWith('message', messageHandler);
    expect(channel.close).toHaveBeenCalledTimes(1);
  });
  it('broadcasts token changes to other listeners when detected', () => {
    (window as any).BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    const { trigger } = setupCookieStoreWithAddEventListener();

    mockGetAuthJwt.mockReturnValue('initial');

    renderHook(() => useWebSocketHealth());

    const channel = MockBroadcastChannel.instances[0];
    channel.postMessage.mockClear();
    mockGetAuthJwt.mockReturnValue('next');

    act(() => {
      trigger({ changed: [{ name: WALLET_AUTH_COOKIE }] });
    });

    expect(channel.postMessage).toHaveBeenCalledWith({ type: 'auth-token-changed' });
  });

});

