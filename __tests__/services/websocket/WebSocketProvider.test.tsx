import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { WebSocketProvider } from '@/services/websocket/WebSocketProvider';
import { WebSocketContext } from '@/services/websocket/WebSocketContext';
import { WebSocketStatus, WebSocketConfig } from '@/services/websocket/WebSocketTypes';
import { WsMessageType } from '@/helpers/Types';
import * as authUtils from '@/services/auth/auth.utils';

// Mock auth utils
jest.mock('@/services/auth/auth.utils', () => ({
  getAuthJwt: jest.fn()
}));

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;
  
  readyState = 0; // Start as CONNECTING
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sent: string[] = [];
  close = jest.fn();
  send = jest.fn((msg: string) => { 
    if (this.readyState === MockWebSocket.OPEN) {
      this.sent.push(msg); 
    } else {
      throw new Error('WebSocket is not open');
    }
  });
  
  constructor(public url: string) {}
  
  triggerOpen() { 
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }
  
  triggerClose(code: number = 1000, reason: string = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }
  
  triggerError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
  
  triggerMessage(msg: any) { 
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(msg) }));
    }
  }
}

describe('WebSocketProvider', () => {
  let originalWs: any;
  let mockGetAuthJwt: jest.MockedFunction<typeof authUtils.getAuthJwt>;
  
  beforeEach(() => {
    originalWs = global.WebSocket;
    (global as any).WebSocket = jest.fn((url: string) => new MockWebSocket(url));
    (global as any).WebSocket.OPEN = 1;
    (global as any).WebSocket.CONNECTING = 0;
    (global as any).WebSocket.CLOSING = 2;
    (global as any).WebSocket.CLOSED = 3;
    
    mockGetAuthJwt = authUtils.getAuthJwt as jest.MockedFunction<typeof authUtils.getAuthJwt>;
    mockGetAuthJwt.mockReturnValue('fresh-token');
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    (global as any).WebSocket = originalWs;
    jest.useRealTimers();
  });

  const createWrapper = (config: WebSocketConfig) => ({ children }: { children: React.ReactNode }) => (
    <WebSocketProvider config={config}>{children}</WebSocketProvider>
  );

  describe('Basic Connection Management', () => {
    it('initializes with disconnected status', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
      expect(result.current.config).toEqual({ url: 'ws://test' });
    });

    it('connects and transitions status correctly', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('test-token');
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTING);
      expect(global.WebSocket).toHaveBeenCalledWith('ws://test?token=test-token');
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
    });

    it('connects without token when not provided', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect();
      });
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://test');
    });

    it('disconnects intentionally and prevents reconnection', () => {
      jest.useFakeTimers();
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      
      act(() => {
        result.current.disconnect();
      });
      
      expect(ws.close).toHaveBeenCalledWith(1000, 'Intentional disconnect');
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
      
      // Simulate close event after manual disconnect
      act(() => {
        ws.triggerClose(1000, 'Intentional disconnect');
      });
      
      // Should not attempt reconnection after intentional disconnect
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    it('handles messaging and subscription correctly', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });

      const callback = jest.fn();
      let unsubscribe: () => void;
      
      act(() => {
        unsubscribe = result.current.subscribe(WsMessageType.DROP_UPDATE, callback);
      });
      
      // Test message routing
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 1 } });
      });
      
      expect(callback).toHaveBeenCalledWith({ id: 1 });
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Test unsubscribe
      act(() => {
        unsubscribe();
      });
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 2 } });
      });
      
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('sends messages only when connection is open', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      // Try to send when disconnected - should not throw but not send
      act(() => {
        result.current.send(WsMessageType.DROP_UPDATE, { id: 1 });
      });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      // Try to send when connecting - should not send
      act(() => {
        result.current.send(WsMessageType.DROP_UPDATE, { id: 2 });
      });
      
      expect(ws.send).not.toHaveBeenCalled();
      
      act(() => {
        ws.triggerOpen();
      });
      
      // Now should send
      act(() => {
        result.current.send(WsMessageType.DROP_UPDATE, { id: 3 });
      });
      
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: WsMessageType.DROP_UPDATE, id: 3 }));
    });

    it('handles malformed messages gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      // Simulate malformed JSON message
      act(() => {
        if (ws.onmessage) {
          ws.onmessage(new MessageEvent('message', { data: 'invalid-json' }));
        }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse WebSocket message:', expect.any(SyntaxError));
      
      consoleSpy.mockRestore();
    });

    it('handles subscriber callback errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });

      const faultyCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      act(() => {
        result.current.subscribe(WsMessageType.DROP_UPDATE, faultyCallback);
      });
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 1 } });
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in subscriber callback:', expect.any(Error));
      expect(faultyCallback).toHaveBeenCalledWith({ id: 1 });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Reconnection Logic - Fail Fast Patterns', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });

    it('reconnects automatically on unexpected close with exponential backoff', () => {
      mockGetAuthJwt.mockReturnValue('fresh-token');
      
      const wrapper = createWrapper({ url: 'ws://test', reconnectDelay: 1000 });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('original-token');
      });
      
      const ws1 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws1.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      
      // Simulate unexpected close (not code 1000)
      act(() => {
        ws1.triggerClose(1006, 'Connection lost');
      });
      
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
      
      // First reconnect attempt after 1000ms
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      expect(global.WebSocket).toHaveBeenLastCalledWith('ws://test?token=fresh-token');
      
      const ws2 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[1].value as MockWebSocket;
      
      // Simulate another failure
      act(() => {
        ws2.triggerClose(1006, 'Connection lost again');
      });
      
      // Second reconnect attempt after exponential backoff (1000 * 1.5^1 = 1500ms)
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(3);
    });

    it('stops reconnecting after max attempts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetAuthJwt.mockReturnValue('fresh-token');
      
      const wrapper = createWrapper({
        url: 'ws://test',
        reconnectDelay: 100,
        maxReconnectAttempts: 2
      });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws1 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws1.triggerOpen();
      });
      
      // Simulate unexpected close
      act(() => {
        ws1.triggerClose(1006);
      });
      
      // First reconnect
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const ws2 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[1].value as MockWebSocket;
      
      // Fail second attempt
      act(() => {
        ws2.triggerClose(1006);
      });
      
      // Second reconnect
      act(() => {
        jest.advanceTimersByTime(150); // 100 * 1.5^1
      });
      
      const ws3 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[2].value as MockWebSocket;
      
      // Fail third attempt - should stop trying
      act(() => {
        ws3.triggerClose(1006);
      });
      
      // Should not reconnect after max attempts
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket reconnect failed after 2 attempts');
      
      consoleSpy.mockRestore();
    });

    it('does not reconnect when no fresh token is available', () => {
      mockGetAuthJwt.mockReturnValue(null);
      
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect(); // Connect without token
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      // Simulate unexpected close
      act(() => {
        ws.triggerClose(1006);
      });
      
      // Should not attempt reconnect without token
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });

    it('resets reconnect attempts on successful connection', () => {
      mockGetAuthJwt.mockReturnValue('fresh-token');
      
      const wrapper = createWrapper({ url: 'ws://test', reconnectDelay: 100 });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws1 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws1.triggerOpen();
      });
      
      // Simulate failure and reconnect
      act(() => {
        ws1.triggerClose(1006);
      });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      const ws2 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[1].value as MockWebSocket;
      
      // This time connection succeeds
      act(() => {
        ws2.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      
      // Now if it fails again, it should start from attempt 0 again
      act(() => {
        ws2.triggerClose(1006);
      });
      
      // Should use base delay again (not exponentially increased)
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling - Security & Edge Cases', () => {
    it('handles WebSocket constructor errors', () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock WebSocket constructor to throw
      (global as any).WebSocket = jest.fn(() => {
        throw new Error('WebSocket creation failed');
      });
      
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect to WebSocket:', expect.any(Error));
      
      // Should attempt reconnect even for constructor errors
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
      jest.useRealTimers();
    });

    it('handles WebSocket error events', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerError();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Event));
      
      consoleSpy.mockRestore();
    });

    it('closes existing connection before creating new one', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token1');
      });
      
      const ws1 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws1.triggerOpen();
      });
      
      // Connect again while already connected
      act(() => {
        result.current.connect('token2');
      });
      
      expect(ws1.close).toHaveBeenCalled();
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      expect(global.WebSocket).toHaveBeenLastCalledWith('ws://test?token=token2');
    });
  });

  describe('Subscription Management', () => {
    it('manages multiple subscribers for same message type', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });

      const callback1 = jest.fn();
      const callback2 = jest.fn();
      let unsubscribe1: () => void;
      let unsubscribe2: () => void;
      
      act(() => {
        unsubscribe1 = result.current.subscribe(WsMessageType.DROP_UPDATE, callback1);
        unsubscribe2 = result.current.subscribe(WsMessageType.DROP_UPDATE, callback2);
      });
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 1 } });
      });
      
      expect(callback1).toHaveBeenCalledWith({ id: 1 });
      expect(callback2).toHaveBeenCalledWith({ id: 1 });
      
      // Unsubscribe one
      act(() => {
        unsubscribe1();
      });
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 2 } });
      });
      
      expect(callback1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(callback2).toHaveBeenCalledTimes(2); // Should still be called
      
      // Unsubscribe the last one - should clean up the subscriber set
      act(() => {
        unsubscribe2();
      });
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 3 } });
      });
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
    });

    it('handles subscribers for different message types', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });

      const updateCallback = jest.fn();
      const deleteCallback = jest.fn();
      
      act(() => {
        result.current.subscribe(WsMessageType.DROP_UPDATE, updateCallback);
        result.current.subscribe(WsMessageType.DROP_DELETE, deleteCallback);
      });
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 1 } });
      });
      
      expect(updateCallback).toHaveBeenCalledWith({ id: 1 });
      expect(deleteCallback).not.toHaveBeenCalled();
      
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_DELETE, data: { id: 2 } });
      });
      
      expect(updateCallback).toHaveBeenCalledTimes(1);
      expect(deleteCallback).toHaveBeenCalledWith({ id: 2 });
    });

    it('ignores messages with no subscribers', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      // Send message with no subscribers - should not throw
      act(() => {
        ws.triggerMessage({ type: WsMessageType.DROP_UPDATE, data: { id: 1 } });
      });
      
      // No errors should be thrown
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
    });
  });

  describe('Component Lifecycle and Cleanup', () => {
    it('cleans up connection on unmount', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result, unmount } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      
      unmount();
      
      expect(ws.close).toHaveBeenCalledWith(1000, 'Component unmounting');
    });

    it('clears pending reconnect timers on unmount', () => {
      jest.useFakeTimers();
      mockGetAuthJwt.mockReturnValue('fresh-token');
      
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result, unmount } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      // Simulate unexpected close to trigger reconnect timer
      act(() => {
        ws.triggerClose(1006);
      });
      
      // Unmount before reconnect timer fires
      unmount();
      
      // Advance time to when reconnect would have happened
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Should not attempt reconnect after unmount
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('handles multiple connect/disconnect cycles', () => {
      const wrapper = createWrapper({ url: 'ws://test' });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      // First connection cycle
      act(() => {
        result.current.connect('token1');
      });
      
      let ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      
      act(() => {
        result.current.disconnect();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
      
      // Second connection cycle
      act(() => {
        result.current.connect('token2');
      });
      
      ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[1].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      expect(global.WebSocket).toHaveBeenLastCalledWith('ws://test?token=token2');
    });
  });

  describe('Configuration Options', () => {
    it('uses custom reconnect delay', () => {
      jest.useFakeTimers();
      mockGetAuthJwt.mockReturnValue('fresh-token');
      
      const customDelay = 5000;
      const wrapper = createWrapper({
        url: 'ws://test',
        reconnectDelay: customDelay
      });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws.triggerOpen();
      });
      
      act(() => {
        ws.triggerClose(1006);
      });
      
      // Should not reconnect before custom delay
      act(() => {
        jest.advanceTimersByTime(customDelay - 1);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(1);
      
      // Should reconnect after custom delay
      act(() => {
        jest.advanceTimersByTime(1);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('respects max reconnect attempts configuration', () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetAuthJwt.mockReturnValue('fresh-token');
      
      const maxAttempts = 3;
      const wrapper = createWrapper({
        url: 'ws://test',
        reconnectDelay: 100,
        maxReconnectAttempts: maxAttempts
      });
      const { result } = renderHook(() => React.useContext(WebSocketContext)!, { wrapper });
      
      act(() => {
        result.current.connect('token');
      });
      
      const ws1 = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[0].value as MockWebSocket;
      
      act(() => {
        ws1.triggerOpen();
      });
      
      // Fail and reconnect maxAttempts times
      for (let i = 0; i < maxAttempts; i++) {
        const wsIndex = i;
        const ws = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[wsIndex].value as MockWebSocket;
        
        act(() => {
          ws.triggerClose(1006);
        });
        
        // Advance time for reconnect attempt
        const delay = 100 * Math.pow(1.5, i);
        act(() => {
          jest.advanceTimersByTime(delay);
        });
      }
      
      // One final failure to trigger the max attempts warning
      const lastWs = (global.WebSocket as jest.MockedFunction<typeof WebSocket>).mock.results[maxAttempts].value as MockWebSocket;
      act(() => {
        lastWs.triggerClose(1006);
      });
      
      // Advance time to trigger the check for exceeding max attempts
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(global.WebSocket).toHaveBeenCalledTimes(maxAttempts + 1); // Initial + maxAttempts reconnects
      expect(consoleSpy).toHaveBeenCalledWith(`WebSocket reconnect failed after ${maxAttempts} attempts`);
      
      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
