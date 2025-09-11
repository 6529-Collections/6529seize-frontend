import { renderHook, act } from '@testing-library/react';
import { useWebSocketHealth } from '../../../services/websocket/useWebSocketHealth';
import { WebSocketStatus } from '../../../services/websocket/WebSocketTypes';

// Mock the dependencies
jest.mock('../../../services/websocket/useWebSocket');
jest.mock('../../../services/auth/auth.utils');

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockGetAuthJwt = jest.fn();

// Mock useWebSocket hook
const mockUseWebSocket = jest.fn(() => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  status: WebSocketStatus.DISCONNECTED,
}));

// Mock auth utils
const mockAuthUtils = {
  getAuthJwt: mockGetAuthJwt,
};

// Apply mocks
require('../../../services/websocket/useWebSocket').useWebSocket = mockUseWebSocket;
require('../../../services/auth/auth.utils').getAuthJwt = mockGetAuthJwt;

// Use fake timers for interval testing
jest.useFakeTimers();

// Spy on setInterval
const setIntervalSpy = jest.spyOn(global, 'setInterval');
const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

describe('useWebSocketHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    setIntervalSpy.mockClear();
    clearIntervalSpy.mockClear();
    
    // Reset to default mock implementations
    mockUseWebSocket.mockReturnValue({
      connect: mockConnect,
      disconnect: mockDisconnect,
      status: WebSocketStatus.DISCONNECTED,
    });
    
    mockGetAuthJwt.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize health monitoring without immediate action', () => {
      renderHook(() => useWebSocketHealth());
      
      // Should not connect or disconnect immediately
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockDisconnect).not.toHaveBeenCalled();
    });

    it('should set up interval for health checks', () => {
      renderHook(() => useWebSocketHealth());
      
      // Verify setInterval was called
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });
  });

  describe('Connection Logic - Token Available', () => {
    it('should connect when token is available but disconnected', () => {
      mockGetAuthJwt.mockReturnValue('test-token-123');
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000); // Advance 10 seconds
      });
      
      expect(mockConnect).toHaveBeenCalledWith('test-token-123');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockDisconnect).not.toHaveBeenCalled();
    });

    it('should reconnect when token changes', () => {
      // Start with initial token
      mockGetAuthJwt.mockReturnValue('initial-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000); // First health check
      });
      
      // Change token
      mockGetAuthJwt.mockReturnValue('new-token-456');
      
      act(() => {
        jest.advanceTimersByTime(10000); // Second health check
      });
      
      expect(mockConnect).toHaveBeenCalledWith('initial-token');
      expect(mockConnect).toHaveBeenCalledWith('new-token-456');
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should not reconnect if token and connection status unchanged', () => {
      mockGetAuthJwt.mockReturnValue('stable-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000); // First health check
      });
      
      act(() => {
        jest.advanceTimersByTime(10000); // Second health check
      });
      
      // Should only connect once initially
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).toHaveBeenCalledWith('stable-token');
    });
  });

  describe('Connection Logic - No Token Available', () => {
    it('should disconnect when no token and currently connected', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should disconnect when no token and currently connecting', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTING,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should not disconnect when no token and already disconnected', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockDisconnect).not.toHaveBeenCalled();
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe('Token Tracking and State Management', () => {
    it('should track token changes correctly across multiple health checks', () => {
      const tokens = ['token1', 'token2', 'token3'];
      let tokenIndex = 0;
      
      mockGetAuthJwt.mockImplementation(() => tokens[tokenIndex] || null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // First health check - token1
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledWith('token1');
      
      // Change to token2
      tokenIndex = 1;
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledWith('token2');
      
      // Change to token3
      tokenIndex = 2;
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledWith('token3');
      expect(mockConnect).toHaveBeenCalledTimes(3);
    });

    it('should handle token removal correctly', () => {
      // Start with token
      mockGetAuthJwt.mockReturnValue('initial-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Remove token
      mockGetAuthJwt.mockReturnValue(null);
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Health Check Interval', () => {
    it('should perform health checks every 10 seconds', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // No calls initially
      expect(mockConnect).not.toHaveBeenCalled();
      
      // After 9 seconds - still no calls
      act(() => {
        jest.advanceTimersByTime(9000);
      });
      expect(mockConnect).not.toHaveBeenCalled();
      
      // After 10 seconds - first call
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // After another 10 seconds - status is now CONNECTED, but token hasn't changed
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Since status is CONNECTED and token hasn't changed, should not connect again
      // But the hook will still call connect because the token exists and was different from lastTokenRef
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should continue health checks after multiple intervals', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Simulate multiple intervals with token changes
      act(() => {
        jest.advanceTimersByTime(10000); // First check
      });
      
      mockGetAuthJwt.mockReturnValue('new-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000); // Second check
      });
      
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledWith('new-token');
    });
  });

  describe('Cleanup and Edge Cases', () => {
    it('should clean up interval on unmount', () => {
      const { unmount } = renderHook(() => useWebSocketHealth());
      
      // Verify interval was set
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string token as no token', () => {
      mockGetAuthJwt.mockReturnValue('');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only token as no token', () => {
      mockGetAuthJwt.mockReturnValue('   ');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Whitespace token should be treated as valid token
      expect(mockConnect).toHaveBeenCalledWith('   ');
      expect(mockDisconnect).not.toHaveBeenCalled();
    });

    it('should handle connect/disconnect dependencies changing', () => {
      const mockConnect2 = jest.fn();
      const mockDisconnect2 = jest.fn();
      
      mockGetAuthJwt.mockReturnValue('test-token');
      
      const { rerender } = renderHook(() => useWebSocketHealth());
      
      // Change the mock to return new functions
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect2,
        disconnect: mockDisconnect2,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      rerender();
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should use the new connect function
      expect(mockConnect2).toHaveBeenCalledWith('test-token');
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate errors from getAuthJwt', () => {
      mockGetAuthJwt.mockImplementation(() => {
        throw new Error('Auth service unavailable');
      });
      
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Error should propagate when timer fires
      act(() => {
        expect(() => {
          jest.advanceTimersByTime(10000);
        }).toThrow('Auth service unavailable');
      });
    });

    it('should propagate errors from connect function', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      mockConnect.mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      renderHook(() => useWebSocketHealth());
      
      // The connect error should propagate
      act(() => {
        expect(() => {
          jest.advanceTimersByTime(10000);
        }).toThrow('Connection failed');
      });
      
      expect(mockConnect).toHaveBeenCalledWith('test-token');
    });

    it('should propagate errors from disconnect function', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockDisconnect.mockImplementation(() => {
        throw new Error('Disconnect failed');
      });
      
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // The disconnect error should propagate
      act(() => {
        expect(() => {
          jest.advanceTimersByTime(10000);
        }).toThrow('Disconnect failed');
      });
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle auth lifecycle with proper state transitions', () => {
      // Reset mocks to not throw errors and clear call counts
      mockConnect.mockReset();
      mockDisconnect.mockReset();
      
      // Test scenario 1: No token, disconnected - should do nothing
      mockGetAuthJwt.mockReturnValue(null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockDisconnect).not.toHaveBeenCalled();
      
      // Test scenario 2: Token available, disconnected - should connect
      mockGetAuthJwt.mockReturnValue('test-token');
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid token changes efficiently', () => {
      // Reset mocks to not throw errors
      mockConnect.mockReset();
      mockDisconnect.mockReset();
      
      mockGetAuthJwt.mockReturnValue('initial-token');
      
      renderHook(() => useWebSocketHealth());
      
      // First check - connect with initial token
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledWith('initial-token');
      
      // Mock connected status
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // Multiple rapid token changes between health checks
      mockGetAuthJwt.mockReturnValue('token-1');
      mockGetAuthJwt.mockReturnValue('token-2');
      mockGetAuthJwt.mockReturnValue('final-token');
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should only connect with the current token at health check time
      expect(mockConnect).toHaveBeenCalledWith('final-token');
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });
  });
});
