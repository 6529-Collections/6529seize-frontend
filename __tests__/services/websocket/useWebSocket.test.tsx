import { renderHook } from '@testing-library/react';
import { useWebSocket } from '../../../services/websocket/useWebSocket';
import { WebSocketContext } from '../../../services/websocket/WebSocketContext';

describe('useWebSocket', () => {
  const value = {
    status: 'connected',
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    send: jest.fn(),
    config: { url: 'ws' },
  } as any;

  it('returns context value when inside provider', () => {
    const wrapper = ({ children }: any) => (
      <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
    );
    const { result } = renderHook(() => useWebSocket(), { wrapper });
    expect(result.current).toBe(value);
  });

  it('throws error when used outside provider', () => {
    const { result } = renderHook(() => {
      try { return useWebSocket(); } catch (e) { return e; }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
