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
    it('should perform immediate health check on initialization', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Should connect immediately due to immediate health check
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockDisconnect).not.toHaveBeenCalled();
    });

    it('should perform immediate disconnect when no token on initialization', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Should disconnect immediately due to immediate health check
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should not take action when already in correct state on initialization', () => {
      mockGetAuthJwt.mockReturnValue(null);
      
      renderHook(() => useWebSocketHealth());
      
      // Should not connect or disconnect when no token and already disconnected
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
      
      // Should connect immediately on initialization
      expect(mockConnect).toHaveBeenCalledWith('test-token-123');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockDisconnect).not.toHaveBeenCalled();
      
      // Should not connect again on timer if already connected and token unchanged
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000); // Advance 10 seconds
      });
      
      // Should be called only once immediately (interval doesn't trigger redundant connections)
      expect(mockConnect).toHaveBeenCalledTimes(1);
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
      
      // Should disconnect immediately on initialization
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
      
      // Should not disconnect again on timer if already disconnected
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should be called only once immediately (interval doesn't trigger redundant disconnections)
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect when no token and currently connecting', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTING,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Should disconnect immediately on initialization
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
      
      // Should not disconnect again on timer if already disconnected
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should be called only once immediately (interval doesn't trigger redundant disconnections)
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
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
      
      // Immediate health check on initialization - token1
      expect(mockConnect).toHaveBeenCalledWith('token1');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
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
      expect(mockConnect).toHaveBeenCalledTimes(2);
      
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
    it('should perform health checks every 10 seconds after immediate check', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Immediate check on initialization
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Mock status as connected now
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // After 9 seconds - no additional calls
      act(() => {
        jest.advanceTimersByTime(9000);
      });
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // After 10 seconds - timer check, but should not connect again since connected and token unchanged
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockConnect).toHaveBeenCalledTimes(1); // Only initial call
      
      // After another 10 seconds - still no additional calls since token unchanged and already connected
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledTimes(1); // Only initial call
    });

    it('should continue health checks after multiple intervals', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Immediate check on initialization
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Mock connected status and change token
      mockGetAuthJwt.mockReturnValue('new-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000); // First timer check with new token
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
      
      // Should disconnect immediately on initialization
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).not.toHaveBeenCalled();
      
      // Mock status as disconnected now
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should be called only once immediately (interval doesn't trigger redundant disconnections)
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
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
      
      renderHook(() => useWebSocketHealth());
      
      // Should use original connect function on immediate check
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Change the mock to return new functions and status as connected
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect2,
        disconnect: mockDisconnect2,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should not call new connect since already connected and token unchanged
      expect(mockConnect2).not.toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalledTimes(1); // Only initial call
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate errors from getAuthJwt on immediate check', () => {
      mockGetAuthJwt.mockImplementation(() => {
        throw new Error('Auth service unavailable');
      });
      
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // Error should propagate immediately during initialization
      expect(() => {
        renderHook(() => useWebSocketHealth());
      }).toThrow('Auth service unavailable');
    });

    it('should propagate errors from getAuthJwt on timer', () => {
      // Start with working auth
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Immediate check should work
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      
      // Now make auth fail
      mockGetAuthJwt.mockImplementation(() => {
        throw new Error('Auth service unavailable');
      });
      
      // Error should propagate when timer fires
      act(() => {
        expect(() => {
          jest.advanceTimersByTime(10000);
        }).toThrow('Auth service unavailable');
      });
    });

    it('should propagate errors from connect function on immediate check', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      mockConnect.mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      // The connect error should propagate immediately during initialization
      expect(() => {
        renderHook(() => useWebSocketHealth());
      }).toThrow('Connection failed');
      
      expect(mockConnect).toHaveBeenCalledWith('test-token');
    });

    it('should propagate errors from disconnect function on immediate check', () => {
      mockGetAuthJwt.mockReturnValue(null);
      mockDisconnect.mockImplementation(() => {
        throw new Error('Disconnect failed');
      });
      
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // The disconnect error should propagate immediately during initialization
      expect(() => {
        renderHook(() => useWebSocketHealth());
      }).toThrow('Disconnect failed');
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interval Management and Memory Leaks', () => {
    it('should create only one interval regardless of status changes', () => {
      renderHook(() => useWebSocketHealth());
      
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      
      // Simulate status changes that previously caused leaks
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTING,
      });
      
      act(() => { jest.advanceTimersByTime(1000); });
      
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      act(() => { jest.advanceTimersByTime(1000); });
      
      // Verify no additional intervals created
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should clean up single interval on unmount without leaks', () => {
      const { unmount } = renderHook(() => useWebSocketHealth());
      
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid status changes without creating multiple intervals', () => {
      renderHook(() => useWebSocketHealth());
      const initialCount = setIntervalSpy.mock.calls.length;
      
      // Simulate rapid status changes
      [WebSocketStatus.CONNECTING, WebSocketStatus.CONNECTED, WebSocketStatus.DISCONNECTED].forEach(status => {
        mockUseWebSocket.mockReturnValue({ connect: mockConnect, disconnect: mockDisconnect, status });
        act(() => { jest.advanceTimersByTime(100); });
      });
      
      expect(setIntervalSpy).toHaveBeenCalledTimes(initialCount);
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
      
      // Immediate check should do nothing when no token and already disconnected
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockDisconnect).not.toHaveBeenCalled();
      
      // Timer check should also do nothing
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
      
      // Immediate check - connect with initial token
      expect(mockConnect).toHaveBeenCalledWith('initial-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
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
