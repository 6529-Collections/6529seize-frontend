import { renderHook } from '@testing-library/react';
import { useWebSocketMessage, useWebSocketMessages, useWebsocketStatus } from '../../services/websocket/useWebSocketMessage';
import { WebSocketStatus } from '../../services/websocket/WebSocketTypes';

jest.mock('../../services/websocket/useWebSocket', () => ({ useWebSocket: jest.fn() }));
const { useWebSocket } = require('../../services/websocket/useWebSocket');

describe('useWebSocketMessage', () => {
  const subscribe = jest.fn();
  const unsubscribe = jest.fn();

  beforeEach(() => {
    subscribe.mockReset();
    unsubscribe.mockReset();
    (useWebSocket as jest.Mock).mockReturnValue({
      subscribe: jest.fn(() => unsubscribe),
      status: WebSocketStatus.CONNECTED,
    });
  });

  it('subscribes and unsubscribes when connected', () => {
    const cb = jest.fn();
    const { unmount } = renderHook(() => useWebSocketMessage('TYPE' as any, cb));
    expect(useWebSocket().subscribe).toHaveBeenCalledWith('TYPE', cb);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('does not subscribe when not connected', () => {
    (useWebSocket as jest.Mock).mockReturnValue({
      subscribe,
      status: WebSocketStatus.DISCONNECTED,
    });
    renderHook(() => useWebSocketMessage('TYPE' as any, jest.fn()));
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe('useWebSocketMessages', () => {
  const subscribe = jest.fn();
  const unsubA = jest.fn();
  const unsubB = jest.fn();
  beforeEach(() => {
    subscribe.mockReset();
    unsubA.mockReset();
    unsubB.mockReset();
    (useWebSocket as jest.Mock).mockReturnValue({
      subscribe: jest
        .fn()
        .mockImplementation((t) => (t === 'A' ? unsubA : unsubB)),
      status: WebSocketStatus.CONNECTED,
    });
  });

  it('subscribes to all messages and cleans up', () => {
    const { unmount } = renderHook(() =>
      useWebSocketMessages({ A: jest.fn(), B: jest.fn() } as any)
    );
    expect(useWebSocket().subscribe).toHaveBeenCalledTimes(2);
    unmount();
    expect(unsubA).toHaveBeenCalled();
    expect(unsubB).toHaveBeenCalled();
  });
});

describe('useWebsocketStatus', () => {
  it('returns status', () => {
    (useWebSocket as jest.Mock).mockReturnValue({ status: 'S' });
    const { result } = renderHook(() => useWebsocketStatus());
    expect(result.current).toBe('S');
  });
});
