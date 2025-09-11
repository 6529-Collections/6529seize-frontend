import React from 'react';
import { renderHook } from '@testing-library/react';
import { useWebSocket } from '../../../services/websocket/useWebSocket';
import { WebSocketContext, WebSocketContextValue } from '../../../services/websocket/WebSocketContext';
import { WebSocketStatus } from '../../../services/websocket/WebSocketTypes';

describe('useWebSocket', () => {
  const mockContextValue: WebSocketContextValue = {
    status: WebSocketStatus.CONNECTED,
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    send: jest.fn(),
    config: { url: 'ws://localhost:8080' },
  };

  const createWrapper = (contextValue: WebSocketContextValue) => {
    return ({ children }: { children: React.ReactNode }) => (
      <WebSocketContext.Provider value={contextValue}>
        {children}
      </WebSocketContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('returns context value when used inside WebSocketProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketContext.Provider value={mockContextValue}>
          {children}
        </WebSocketContext.Provider>
      );
      
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current).toBe(mockContextValue);
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
      expect(result.current.config.url).toBe('ws://localhost:8080');
    });

    it('throws descriptive error when used outside WebSocketProvider', () => {
      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');
    });

    it('throws error immediately without wrapper in try/catch', () => {
      const { result } = renderHook(() => {
        try { 
          return useWebSocket(); 
        } catch (e) { 
          return e; 
        }
      });
      
      expect(result.current).toBeInstanceOf(Error);
      expect((result.current as Error).message).toBe('useWebSocket must be used within a WebSocketProvider');
    });
  });

  describe('Context Value Access', () => {

    it('provides access to connection status', () => {
      const disconnectedValue = {
        ...mockContextValue,
        status: WebSocketStatus.DISCONNECTED,
      };
      
      const wrapper = createWrapper(disconnectedValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
    });

    it('provides access to connecting status', () => {
      const connectingValue = {
        ...mockContextValue,
        status: WebSocketStatus.CONNECTING,
      };
      
      const wrapper = createWrapper(connectingValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTING);
    });

    it('provides access to connect function', () => {
      const wrapper = createWrapper(mockContextValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.connect).toBe(mockContextValue.connect);
      expect(typeof result.current.connect).toBe('function');
    });

    it('provides access to disconnect function', () => {
      const wrapper = createWrapper(mockContextValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.disconnect).toBe(mockContextValue.disconnect);
      expect(typeof result.current.disconnect).toBe('function');
    });

    it('provides access to subscribe function', () => {
      const wrapper = createWrapper(mockContextValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.subscribe).toBe(mockContextValue.subscribe);
      expect(typeof result.current.subscribe).toBe('function');
    });

    it('provides access to send function', () => {
      const wrapper = createWrapper(mockContextValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.send).toBe(mockContextValue.send);
      expect(typeof result.current.send).toBe('function');
    });

    it('provides access to configuration object', () => {
      const customConfig = {
        url: 'wss://custom.example.com',
        reconnectDelay: 5000,
        maxReconnectAttempts: 10,
      };
      
      const contextValue = {
        ...mockContextValue,
        config: customConfig,
      };
      
      const wrapper = createWrapper(contextValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.config).toEqual(customConfig);
      expect(result.current.config.url).toBe('wss://custom.example.com');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('handles undefined context value gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketContext.Provider value={undefined as any}>
          {children}
        </WebSocketContext.Provider>
      );
      
      expect(() => {
        renderHook(() => useWebSocket(), { wrapper });
      }).toThrow('useWebSocket must be used within a WebSocketProvider');
    });

    it('handles null context value gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketContext.Provider value={null as any}>
          {children}
        </WebSocketContext.Provider>
      );
      
      const { result } = renderHook(() => {
        try { 
          return useWebSocket(); 
        } catch (e) { 
          return e; 
        }
      }, { wrapper });
      
      expect(result.current).toBeInstanceOf(Error);
      expect((result.current as Error).message).toBe('useWebSocket must be used within a WebSocketProvider');
    });

    it('returns consistent reference across re-renders', () => {
      const wrapper = createWrapper(mockContextValue);
      const { result, rerender } = renderHook(() => useWebSocket(), { wrapper });
      
      const initialResult = result.current;
      
      rerender();
      
      expect(result.current).toBe(initialResult);
    });

    it('returns updated context when provider value changes', () => {
      const initialValue = {
        ...mockContextValue,
        status: WebSocketStatus.DISCONNECTED,
      };
      
      const updatedValue = {
        ...mockContextValue,
        status: WebSocketStatus.CONNECTED,
      };
      
      let contextValue = initialValue;
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketContext.Provider value={contextValue}>
          {children}
        </WebSocketContext.Provider>
      );
      
      const { result, rerender } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
      
      contextValue = updatedValue;
      rerender();
      
      expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
    });
  });

  describe('Type Safety and Contract', () => {
    it('maintains proper TypeScript contract', () => {
      const wrapper = createWrapper(mockContextValue);
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      // Verify all required properties exist
      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('connect');
      expect(result.current).toHaveProperty('disconnect');
      expect(result.current).toHaveProperty('subscribe');
      expect(result.current).toHaveProperty('send');
      expect(result.current).toHaveProperty('config');
      
      // Verify types
      expect(typeof result.current.status).toBe('string');
      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.subscribe).toBe('function');
      expect(typeof result.current.send).toBe('function');
      expect(typeof result.current.config).toBe('object');
    });

    it('ensures all WebSocketStatus values are handled', () => {
      const statuses = [
        WebSocketStatus.DISCONNECTED,
        WebSocketStatus.CONNECTING,
        WebSocketStatus.CONNECTED,
      ];
      
      statuses.forEach((status) => {
        const contextValue = {
          ...mockContextValue,
          status,
        };
        
        const wrapper = createWrapper(contextValue);
        const { result } = renderHook(() => useWebSocket(), { wrapper });
        
        expect(result.current.status).toBe(status);
      });
    });
  });
});
