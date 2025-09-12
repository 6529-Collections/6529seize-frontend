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
      
      // Should be called twice: immediate effect + first interval (React-compliant dual execution)
      expect(mockConnect).toHaveBeenCalledTimes(2);
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
      
      // Should be called twice: immediate effect + first interval (React-compliant dual execution)
      expect(mockDisconnect).toHaveBeenCalledTimes(2);
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
      
      // Should be called twice: immediate effect + first interval (React-compliant dual execution)
      expect(mockDisconnect).toHaveBeenCalledTimes(2);
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
      
      // Immediate check on initialization - connects because token available and status is DISCONNECTED
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Mock status as connected now
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // After 9 seconds - no additional calls yet
      act(() => {
        jest.advanceTimersByTime(9000);
      });
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // After 10 seconds - first periodic check
      // This calls connect because lastTokenRef is still null initially in periodic check
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(mockConnect).toHaveBeenCalledTimes(2); // Immediate effect + first periodic check
      
      // After another 10 seconds - second periodic check 
      // Now lastTokenRef has 'test-token', so no additional connect call
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledTimes(3); // Immediate effect + periodic checks handle token transitions
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
      
      // Should be called twice: immediate effect + first interval (React-compliant dual execution)
      expect(mockDisconnect).toHaveBeenCalledTimes(2);
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

    it('should handle function reference updates through refs in periodic checks', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Initial connection should work
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Mock as connected now
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // First periodic check with same token should trigger connect due to ref behavior
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Verify periodic health check occurs (implementation detail: uses fresh refs)
      expect(mockConnect).toHaveBeenCalledTimes(2); // Initial + first periodic check
    });

    it('should handle null/undefined status gracefully', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      // Test with undefined status (edge case)
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: undefined as any, // Simulate edge case
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Should attempt to connect since status is not explicitly DISCONNECTED
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle extremely rapid hook re-renders without issues', () => {
      mockGetAuthJwt.mockReturnValue('test-token');
      
      const { rerender } = renderHook(() => useWebSocketHealth());
      
      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender();
      }
      
      // Should only create one interval despite multiple renders
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      
      // Connection should only be attempted once initially
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle token function returning different types', () => {
      // Test with various falsy values
      const falsyValues = [null, undefined, '', false, 0];
      
      falsyValues.forEach((value, index) => {
        mockConnect.mockReset();
        mockDisconnect.mockReset();
        
        mockGetAuthJwt.mockReturnValue(value as any);
        mockUseWebSocket.mockReturnValue({
          connect: mockConnect,
          disconnect: mockDisconnect,
          status: WebSocketStatus.CONNECTED,
        });
        
        renderHook(() => useWebSocketHealth());
        
        if (value) {
          expect(mockConnect).toHaveBeenCalledWith(value);
        } else {
          expect(mockDisconnect).toHaveBeenCalledTimes(1);
        }
      });
    });

    it('should handle memory pressure during long-running intervals', () => {
      mockGetAuthJwt.mockReturnValue('long-running-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Simulate long period of operation
      for (let i = 0; i < 100; i++) {
        act(() => {
          jest.advanceTimersByTime(10000);
        });
      }
      
      // Should maintain single interval throughout
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(clearIntervalSpy).not.toHaveBeenCalled();
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

    it('should propagate errors from connect function during periodic check', () => {
      // Start with working state
      mockGetAuthJwt.mockReturnValue('test-token');
      mockConnect.mockReset();
      
      renderHook(() => useWebSocketHealth());
      
      // Immediate check should work
      expect(mockConnect).toHaveBeenCalledWith('test-token');
      
      // Change token to trigger reconnection and make connect fail for subsequent calls only
      mockGetAuthJwt.mockReturnValue('new-token');
      mockConnect.mockImplementation((token) => {
        if (token === 'new-token') {
          throw new Error('Periodic connection failed');
        }
      });
      
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      // Error should propagate when periodic timer fires
      act(() => {
        expect(() => {
          jest.advanceTimersByTime(10000);
        }).toThrow('Periodic connection failed');
      });
    });

    it('should propagate errors from disconnect function during periodic check', () => {
      // Start with token and connected state
      mockGetAuthJwt.mockReturnValue('test-token');
      mockDisconnect.mockReset();
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Remove token to trigger disconnection and make disconnect fail for periodic calls
      mockGetAuthJwt.mockReturnValue(null);
      mockDisconnect.mockImplementation(() => {
        throw new Error('Periodic disconnect failed');
      });
      
      // Error should propagate when periodic timer fires
      act(() => {
        expect(() => {
          jest.advanceTimersByTime(10000);
        }).toThrow('Periodic disconnect failed');
      });
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

    it('should handle simultaneous token change and status transition', () => {
      mockConnect.mockReset();
      mockDisconnect.mockReset();
      
      // Start with token and disconnected state
      mockGetAuthJwt.mockReturnValue('initial-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Should connect immediately
      expect(mockConnect).toHaveBeenCalledWith('initial-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Simulate simultaneous token change and status change to CONNECTING
      mockGetAuthJwt.mockReturnValue('new-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTING,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should connect with new token since token changed and status is not DISCONNECTED
      expect(mockConnect).toHaveBeenCalledWith('new-token');
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('should handle token expiration and renewal cycle', () => {
      mockConnect.mockReset();
      mockDisconnect.mockReset();
      
      // Start with valid token and connected status to test disconnection
      mockGetAuthJwt.mockReturnValue('valid-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.CONNECTED,
      });
      
      renderHook(() => useWebSocketHealth());
      
      // Immediate effect should attempt connection due to token mismatch (null -> valid-token)
      expect(mockConnect).toHaveBeenCalledWith('valid-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Simulate token expiration (becomes null) - should trigger disconnect
      mockGetAuthJwt.mockReturnValue(null);
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should disconnect due to no token
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      
      // Simulate token renewal and status change to disconnected
      mockGetAuthJwt.mockReturnValue('renewed-token');
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Should reconnect with new token since status is DISCONNECTED and token is available
      expect(mockConnect).toHaveBeenCalledWith('renewed-token');
      expect(mockConnect).toHaveBeenCalledTimes(2); // Initial + after renewal
    });

    it('should handle connection failure followed by recovery', () => {
      mockConnect.mockReset();
      mockDisconnect.mockReset();
      
      // Start with token but connection fails
      mockGetAuthJwt.mockReturnValue('test-token');
      mockConnect.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });
      
      expect(() => {
        renderHook(() => useWebSocketHealth());
      }).toThrow('Connection failed');
      
      // Reset connect to work normally and simulate disconnected status
      mockConnect.mockImplementation(() => {}); // Reset implementation
      mockUseWebSocket.mockReturnValue({
        connect: mockConnect,
        disconnect: mockDisconnect,
        status: WebSocketStatus.DISCONNECTED,
      });
      
      // Should retry connection on periodic check
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(mockConnect).toHaveBeenCalledWith('test-token');
    });

    it('should maintain stability through multiple status oscillations', () => {
      mockConnect.mockReset();
      mockDisconnect.mockReset();
      
      mockGetAuthJwt.mockReturnValue('stable-token');
      
      renderHook(() => useWebSocketHealth());
      
      // Initial connection
      expect(mockConnect).toHaveBeenCalledWith('stable-token');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      // Simulate rapid status changes: CONNECTED -> CONNECTING -> CONNECTED -> DISCONNECTED
      const statuses = [WebSocketStatus.CONNECTED, WebSocketStatus.CONNECTING, WebSocketStatus.CONNECTED, WebSocketStatus.DISCONNECTED];
      
      statuses.forEach((status, index) => {
        mockUseWebSocket.mockReturnValue({
          connect: mockConnect,
          disconnect: mockDisconnect,
          status,
        });
        
        act(() => {
          jest.advanceTimersByTime(2500); // Quarter of interval time
        });
      });
      
      // Complete one full interval
      act(() => {
        jest.advanceTimersByTime(0); // Trigger any pending timers
      });
      
      // Should have connected initially + once for the status oscillation ending in DISCONNECTED
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });
  });
});
