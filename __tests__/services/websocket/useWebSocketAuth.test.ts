import { renderHook, act } from '@testing-library/react';
import useWebSocketAuth from '../../../services/websocket/useWebSocketAuth';
import { WebSocketStatus } from '../../../services/websocket/WebSocketTypes';

// Mock the dependencies
jest.mock('../../../services/websocket/useWebSocket');
jest.mock('../../../services/auth/auth.utils');

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockGetAuthJwt = jest.fn();

// Mock useWebSocket hook
require('../../../services/websocket/useWebSocket').useWebSocket = jest.fn(() => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  status: WebSocketStatus.DISCONNECTED,
}));

// Mock auth utils
require('../../../services/auth/auth.utils').getAuthJwt = mockGetAuthJwt;
require('../../../services/auth/auth.utils').WALLET_AUTH_COOKIE = 'test-auth-cookie';

// Mock window objects
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
  writable: true,
});

jest.useFakeTimers();

describe('useWebSocketAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthJwt.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('initializes with no auth token', () => {
    const { result } = renderHook(() => useWebSocketAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
    expect(result.current.disconnect).toBeDefined();
  });

  it('connects when auth token is available', () => {
    mockGetAuthJwt.mockReturnValue('test-token');
    
    const { result } = renderHook(() => useWebSocketAuth());
    
    act(() => {
      // Trigger the interval check
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockConnect).toHaveBeenCalledWith('test-token');
  });

  it('disconnects when auth token is removed', () => {
    // Start with a token and mock connected status
    mockGetAuthJwt.mockReturnValue('test-token');
    require('../../../services/websocket/useWebSocket').useWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.CONNECTED,
    });
    
    const { rerender } = renderHook(() => useWebSocketAuth());
    
    // Remove the token
    mockGetAuthJwt.mockReturnValue(null);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    rerender();
    
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('sets up storage event listener', () => {
    renderHook(() => useWebSocketAuth());
    
    expect(window.addEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    );
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useWebSocketAuth());
    
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    );
  });

  it('updates authenticated state when connected with token', () => {
    mockGetAuthJwt.mockReturnValue('test-token');
    
    // Mock the useWebSocket to return CONNECTED status
    require('../../../services/websocket/useWebSocket').useWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.CONNECTED,
    });
    
    const { result } = renderHook(() => useWebSocketAuth());
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('does not authenticate when connected without token', () => {
    mockGetAuthJwt.mockReturnValue(null);
    
    require('../../../services/websocket/useWebSocket').useWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.CONNECTED,
    });
    
    const { result } = renderHook(() => useWebSocketAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
  });
});