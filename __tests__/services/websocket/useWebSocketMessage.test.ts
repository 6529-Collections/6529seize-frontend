import { renderHook } from '@testing-library/react';
import { useWebSocketMessage } from '@/services/websocket/useWebSocketMessage';
import { WebSocketStatus } from '@/services/websocket/WebSocketTypes';

jest.mock('@/services/websocket/useWebSocket', () => ({
  useWebSocket: jest.fn(),
}));

const { useWebSocket } = require('@/services/websocket/useWebSocket');

describe('useWebSocketMessage', () => {
  it('subscribes when connected and cleans up on unmount', () => {
    const unsubscribe = jest.fn();
    const subscribe = jest.fn().mockReturnValue(unsubscribe);
    useWebSocket.mockReturnValue({ subscribe, status: WebSocketStatus.CONNECTED });
    const callback = jest.fn();
    const { unmount, result } = renderHook(() => useWebSocketMessage('TYPE' as any, callback));
    expect(result.current.isConnected).toBe(true);
    expect(subscribe).toHaveBeenCalledWith('TYPE', callback);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('does nothing when disconnected', () => {
    const subscribe = jest.fn();
    useWebSocket.mockReturnValue({ subscribe, status: WebSocketStatus.DISCONNECTED });
    const { result } = renderHook(() => useWebSocketMessage('T' as any, jest.fn()));
    expect(result.current.isConnected).toBe(false);
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe('useWebsocketStatus', () => {
  it('returns websocket status from context', () => {
    useWebSocket.mockReturnValue({ subscribe: jest.fn(), status: WebSocketStatus.CONNECTED });
    const { useWebsocketStatus } = require('@/services/websocket/useWebSocketMessage');
    const { result } = renderHook(() => useWebsocketStatus());
    expect(result.current).toBe(WebSocketStatus.CONNECTED);
  });
});

it('resubscribes when message type changes', () => {
  const unsub1 = jest.fn();
  const unsub2 = jest.fn();
  const subscribe = jest
    .fn()
    .mockReturnValueOnce(unsub1)
    .mockReturnValueOnce(unsub2);
  useWebSocket.mockReturnValue({ subscribe, status: WebSocketStatus.CONNECTED });
  const { result, rerender, unmount } = renderHook(
    ({ type }) => useWebSocketMessage(type as any, jest.fn()),
    { initialProps: { type: 'A' } }
  );
  expect(result.current.isConnected).toBe(true);
  expect(subscribe).toHaveBeenCalledWith('A', expect.any(Function));
  rerender({ type: 'B' });
  expect(unsub1).toHaveBeenCalled();
  expect(subscribe).toHaveBeenCalledWith('B', expect.any(Function));
  unmount();
  expect(unsub2).toHaveBeenCalled();
});
